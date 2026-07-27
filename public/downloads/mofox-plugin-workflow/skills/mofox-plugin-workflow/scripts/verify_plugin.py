#!/usr/bin/env python
"""Verify a directory-based Neo-MoFox plugin with the real framework loader."""

from __future__ import annotations

import argparse
import ast
import asyncio
import contextlib
import importlib.metadata
import inspect
import io
import json
import os
import subprocess
import sys
import tempfile
import traceback
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

from packaging.requirements import InvalidRequirement, Requirement

PASS, WARN, FAIL, SKIP = "PASS", "WARN", "FAIL", "SKIP"
FRAMEWORK, POLICY, RUNTIME = "FRAMEWORK", "POLICY", "RUNTIME"


@dataclass
class CheckResult:
    """One verifier check."""

    check_id: str
    title: str
    status: str
    category: str
    detail: str = ""
    hint: str = ""


@dataclass
class Report:
    """Serializable verifier report."""

    plugin_path: str
    plugin_name: str = ""
    plugin_version: str = ""
    results: list[CheckResult] = field(default_factory=list)
    components: list[dict[str, Any]] = field(default_factory=list)

    def add(
        self,
        check_id: str,
        title: str,
        status: str,
        category: str,
        detail: str = "",
        hint: str = "",
    ) -> None:
        """Append one check result."""
        self.results.append(
            CheckResult(check_id, title, status, category, detail, hint)
        )

    @property
    def failures(self) -> list[CheckResult]:
        """Return failed checks."""
        return [item for item in self.results if item.status == FAIL]

    @property
    def warnings(self) -> list[CheckResult]:
        """Return warning checks."""
        return [item for item in self.results if item.status == WARN]

    @property
    def passes(self) -> list[CheckResult]:
        """Return passed checks."""
        return [item for item in self.results if item.status == PASS]


def locate_project_root(plugin_path: Path, explicit: str | None) -> Path:
    """Locate the Neo-MoFox project root."""
    candidates = (
        [Path(explicit).resolve()] if explicit else [plugin_path, *plugin_path.parents]
    )
    for candidate in candidates:
        if (candidate / "src" / "app" / "plugin_system").is_dir():
            return candidate
    raise ValueError("无法定位 Neo-MoFox 项目根；请使用 --project-root")


def iter_python_files(plugin_dir: Path) -> list[Path]:
    """Return plugin Python files, excluding generated directories."""
    skipped = {"__pycache__", ".git", ".ruff_cache", ".venv", "build", "dist"}
    return [
        path
        for path in plugin_dir.rglob("*.py")
        if not skipped.intersection(path.parts)
    ]


def static_source_checks(report: Report, plugin_dir: Path) -> None:
    """Check source-level plugin policies."""
    cross: list[str] = []
    self_imports: list[str] = []
    raw_tasks: list[str] = []
    for source_path in iter_python_files(plugin_dir):
        relative = source_path.relative_to(plugin_dir).as_posix()
        try:
            tree = ast.parse(
                source_path.read_text(encoding="utf-8-sig"), str(source_path)
            )
        except (OSError, SyntaxError) as exc:
            report.add("S0", "源码可解析", FAIL, FRAMEWORK, f"{relative}: {exc}")
            continue
        for node in ast.walk(tree):
            modules: list[str] = []
            if isinstance(node, ast.ImportFrom) and node.module:
                modules.append(node.module)
            elif isinstance(node, ast.Import):
                modules.extend(alias.name for alias in node.names)
            for module in modules:
                if module == "plugins" or module.startswith("plugins."):
                    parts = module.split(".")
                    target = parts[1] if len(parts) > 1 else ""
                    item = f"{relative}:{node.lineno} -> {module}"
                    (self_imports if target == plugin_dir.name else cross).append(item)
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
                owner = node.func.value
                if (
                    node.func.attr == "create_task"
                    and isinstance(owner, ast.Name)
                    and owner.id == "asyncio"
                ):
                    raw_tasks.append(f"{relative}:{node.lineno}")
    report.add(
        "S5",
        "无跨插件绝对导入",
        FAIL if cross else PASS,
        POLICY,
        "\n".join(cross) or "未发现",
    )
    report.add(
        "S6",
        "无绝对路径自导入",
        WARN if self_imports else PASS,
        POLICY,
        "\n".join(self_imports) or "未发现",
    )
    report.add(
        "S7",
        "无裸 asyncio.create_task",
        WARN if raw_tasks else PASS,
        POLICY,
        "\n".join(raw_tasks) or "未发现",
    )


def check_python_dependencies(
    report: Report,
    requirements: list[str],
    *,
    required: bool,
) -> None:
    """Check Python requirements without installing anything."""
    errors: list[str] = []
    satisfied: list[str] = []
    skipped: list[str] = []
    for raw in requirements:
        try:
            requirement = Requirement(raw)
        except InvalidRequirement as exc:
            errors.append(f"{raw!r}: 非法 requirement: {exc}")
            continue
        if requirement.marker is not None and not requirement.marker.evaluate():
            skipped.append(f"{requirement}: marker 不适用于当前环境")
            continue
        try:
            installed = importlib.metadata.version(requirement.name)
        except importlib.metadata.PackageNotFoundError:
            errors.append(f"{requirement}: 未安装")
            continue
        if requirement.specifier and installed not in requirement.specifier:
            errors.append(f"{requirement}: 已安装 {installed}")
            continue
        satisfied.append(f"{requirement}: 已安装 {installed}")

    details = [*errors, *satisfied, *skipped]
    if errors:
        status = FAIL if required else WARN
    elif satisfied:
        status = PASS
    elif skipped:
        status = SKIP
    else:
        status = PASS
        details.append("未声明 Python dependencies")
    requirement_kind = "required" if required else "optional"
    report.add(
        "S8",
        "Python dependencies 已满足",
        status,
        RUNTIME,
        f"dependencies_required={requirement_kind}\n" + "\n".join(details),
    )


def reset_framework_singletons() -> None:
    """Reset mutable framework globals before the isolated load."""
    import src.core.components.loader as loader
    import src.core.components.registry as registry_module
    import src.core.components.state_manager as state_module
    import src.core.managers.config_manager as config_module
    import src.core.managers.event_manager as event_module
    import src.core.managers.plugin_manager as plugin_module
    import src.kernel.event as kernel_event

    loader.clear_registry()
    registry_module._global_registry.clear()
    state_module._global_state_manager.clear()
    config_module.reset_config_manager()
    event_module.reset_event_manager()
    kernel_event._event_bus = None
    plugin_module._global_plugin_manager = None


async def plan_with_real_loader(
    report: Report, plugin_dir: Path, manifest: Any
) -> bool:
    """Use PluginLoader's real compatibility checker and resolver plan."""
    from src.core.components.loader import PluginLoader

    loader = PluginLoader()
    compatible, reason = loader._check_version_compatibility(manifest)
    report.add("S9", "框架版本兼容", PASS if compatible else FAIL, FRAMEWORK, reason)
    if not compatible:
        return False
    try:
        order, manifests = await loader.plan_plugins(str(plugin_dir.parent))
    except Exception as exc:
        report.add(
            "S10", "依赖加载计划可解析", FAIL, FRAMEWORK, f"{type(exc).__name__}: {exc}"
        )
        return False
    failure = loader.get_failed_plugins().get(manifest.name)
    planned = manifest.name in manifests and manifest.name in order
    report.add(
        "S10",
        "依赖加载计划可解析",
        PASS if planned else FAIL,
        FRAMEWORK,
        f"order={order}" if planned else (failure or "目标插件未进入加载计划"),
    )
    return planned


def manifest_dependency_sets(manifest: Any) -> tuple[set[str], set[str]]:
    """Normalize manifest plugin/component dependency declarations."""
    plugin_names: set[str] = set()
    for reference in manifest.dependencies.get("plugins", []):
        value = str(reference).strip()
        for marker in ("===", "==", "!=", "~=", ">=", "<=", ">", "<", ":"):
            if marker in value:
                value = value.split(marker, 1)[0].strip()
                break
        if value:
            plugin_names.add(value)
    return plugin_names, set(manifest.dependencies.get("components", []))


async def run_worker(report: Report, plugin_dir: Path, lifecycle: bool) -> None:
    """Run static and real dynamic verification inside the worker process."""
    from src.core.components.loader import get_plugin_class, load_manifest

    manifest_path = plugin_dir / "manifest.json"
    if not manifest_path.is_file():
        report.add("S1", "manifest.json 存在", FAIL, FRAMEWORK, str(manifest_path))
        return
    report.add("S1", "manifest.json 存在", PASS, FRAMEWORK, str(manifest_path))
    try:
        raw_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        report.add("S2", "manifest 可解析", FAIL, FRAMEWORK, str(exc))
        return
    manifest = await load_manifest(str(plugin_dir))
    if manifest is None:
        report.add("S2", "manifest 可解析", FAIL, FRAMEWORK, "load_manifest 返回 None")
        return
    report.plugin_name = manifest.name
    report.plugin_version = manifest.version
    report.add(
        "S2", "manifest 可解析", PASS, FRAMEWORK, f"{manifest.name} v{manifest.version}"
    )
    raw_min_core_version = raw_manifest.get("min_core_version")
    has_explicit_minimum = (
        isinstance(raw_min_core_version, str) and bool(raw_min_core_version.strip())
    )
    report.add(
        "S3",
        "min_core_version 显式声明",
        PASS if has_explicit_minimum else WARN,
        POLICY,
        raw_min_core_version.strip() if has_explicit_minimum else "缺失、null 或空白",
    )
    entry = plugin_dir / manifest.entry_point
    report.add(
        "S4",
        "entry_point 存在",
        PASS if entry.is_file() else FAIL,
        FRAMEWORK,
        str(entry),
    )
    if not entry.is_file():
        return
    static_source_checks(report, plugin_dir)
    check_python_dependencies(
        report,
        list(manifest.python_dependencies),
        required=manifest.dependencies_required,
    )
    if not await plan_with_real_loader(report, plugin_dir, manifest):
        return

    from src.core.components.loader import is_plugin_registered
    from src.core.components.registry import get_global_registry
    from src.core.components.state_manager import get_global_state_manager
    from src.core.components.types import (
        ComponentState,
        ComponentType,
        build_signature,
        parse_signature,
    )
    from src.core.managers.event_manager import get_event_manager
    import src.core.managers.plugin_manager as plugin_manager_module

    reset_framework_singletons()
    manager = plugin_manager_module.PluginManager()
    plugin_manager_module._global_plugin_manager = manager
    original_loader = manager._load_from_folder
    preflight: dict[str, Any] = {"components": None, "error": None}
    lifecycle_results: dict[str, str | None] = {"load": None, "unload": None}

    async def wrapped_loader(folder_path: str, loaded_manifest: Any) -> Any | None:
        module = await original_loader(folder_path, loaded_manifest)
        if module is None:
            return None
        plugin_class = get_plugin_class(loaded_manifest.name)
        if plugin_class is None:
            return module
        original_get_components = plugin_class.get_components
        original_on_loaded = plugin_class.on_plugin_loaded
        original_on_unloaded = plugin_class.on_plugin_unloaded

        def cached_components(instance: Any) -> list[type]:
            cached = getattr(instance, "_verify_components_cache", None)
            if cached is None:
                cached = list(original_get_components(instance))
                setattr(instance, "_verify_components_cache", cached)
                preflight["components"] = cached
            return list(cached)

        async def noop(_instance: Any) -> None:
            return None

        async def tracked_loaded(instance: Any) -> None:
            try:
                await original_on_loaded(instance)
            except Exception as exc:
                lifecycle_results["load"] = f"{type(exc).__name__}: {exc}"
                raise
            lifecycle_results["load"] = "执行完成"

        async def tracked_unloaded(instance: Any) -> None:
            try:
                await original_on_unloaded(instance)
            except Exception as exc:
                lifecycle_results["unload"] = f"{type(exc).__name__}: {exc}"
                raise
            lifecycle_results["unload"] = "执行完成"

        plugin_class.get_components = cached_components
        if lifecycle:
            plugin_class.on_plugin_loaded = tracked_loaded
            plugin_class.on_plugin_unloaded = tracked_unloaded
        else:
            plugin_class.on_plugin_loaded = noop
            plugin_class.on_plugin_unloaded = noop
        return module

    def associated_type_errors(components: list[Any] | None) -> list[str]:
        """Run Action/Agent associated type validation on materialized classes."""
        errors: list[str] = []
        for component_class in components or []:
            if not inspect.isclass(component_class):
                continue
            component_type, component_name, _dependencies = manager._identify_component(
                component_class
            )
            if component_type not in (ComponentType.ACTION, ComponentType.AGENT):
                continue
            try:
                component_class.validate_associated_types()
            except ValueError as exc:
                errors.append(f"{component_name or component_class.__name__}: {exc}")
        return errors

    manager._load_from_folder = wrapped_loader
    try:
        loaded = await manager.load_plugin_from_manifest(str(plugin_dir), manifest)
    except Exception as exc:
        loaded = False
        preflight["error"] = f"{type(exc).__name__}: {exc}"
    report.add(
        "D1",
        "PluginManager.load_plugin_from_manifest",
        PASS if loaded else FAIL,
        RUNTIME,
        preflight["error"]
        or manager._failed_plugins.get(
            manifest.name,
            "加载成功" if loaded else "加载失败",
        ),
    )
    if lifecycle:
        load_detail = lifecycle_results["load"] or "钩子未执行"
        report.add(
            "L1",
            "on_plugin_loaded 在正式 manager 上下文执行",
            PASS if lifecycle_results["load"] == "执行完成" else FAIL,
            RUNTIME,
            load_detail,
        )
    if not loaded:
        associated_errors = associated_type_errors(preflight["components"])
        report.add(
            "D5",
            "Action/Agent associated_types 合法",
            FAIL if associated_errors else SKIP,
            FRAMEWORK,
            "\n".join(associated_errors)
            or "真实加载失败前未发现 associated_types 错误",
        )
        return

    plugin = manager.get_plugin(manifest.name)
    components = preflight["components"]
    if plugin is None or components is None:
        report.add(
            "D2",
            "manager 正式记录插件",
            FAIL,
            FRAMEWORK,
            "manager 未记录实例或未物化组件",
        )
        return
    recorded = (
        manifest.name in manager._manifests and manifest.name in manager._plugin_paths
    )
    report.add(
        "D2",
        "manager 正式记录插件",
        PASS if recorded else FAIL,
        FRAMEWORK,
        f"manifest/path recorded={recorded}",
    )

    bad_components = [repr(item) for item in components if not inspect.isclass(item)]
    config_classes = getattr(plugin.__class__, "configs", [])
    expected_classes = [item for item in components if inspect.isclass(item)]
    if isinstance(config_classes, list):
        expected_classes.extend(
            item
            for item in config_classes
            if inspect.isclass(item) and item not in expected_classes
        )
    report.add(
        "D3",
        "get_components 仅物化类",
        FAIL if bad_components else PASS,
        FRAMEWORK,
        "\n".join(bad_components) or f"{len(components)} 个",
    )

    identified: dict[str, tuple[type, ComponentType, list[str]]] = {}
    identify_errors: list[str] = []
    dependency_errors: list[str] = []
    associated_errors: list[str] = associated_type_errors(components)
    for component_class in expected_classes:
        component_type, component_name, dependencies = manager._identify_component(
            component_class
        )
        if component_type is None or not component_name:
            identify_errors.append(component_class.__name__)
            continue
        signature = build_signature(manifest.name, component_type, component_name)
        try:
            parse_signature(signature)
        except ValueError as exc:
            identify_errors.append(f"{signature}: {exc}")
            continue
        if not isinstance(dependencies, list):
            dependency_errors.append(f"{signature}: dependencies 必须是 list")
            dependencies = []
        for dependency in dependencies:
            try:
                parse_signature(dependency)
            except (TypeError, ValueError) as exc:
                dependency_errors.append(f"{signature} -> {dependency!r}: {exc}")
        identified[signature] = (component_class, component_type, dependencies)
        report.components.append(
            {
                "class": component_class.__name__,
                "type": component_type.value,
                "name": component_name,
                "signature": signature,
                "dependencies": dependencies,
            }
        )
    report.add(
        "D4",
        "实际组件可识别",
        FAIL if identify_errors else PASS,
        FRAMEWORK,
        "\n".join(identify_errors) or f"{len(identified)} 个（含 configs）",
    )
    report.add(
        "D5",
        "Action/Agent associated_types 合法",
        FAIL if associated_errors else PASS,
        FRAMEWORK,
        "\n".join(associated_errors) or "合法",
    )
    report.add(
        "D6",
        "组件依赖签名合法",
        FAIL if dependency_errors else PASS,
        FRAMEWORK,
        "\n".join(dependency_errors) or "合法",
    )

    expected_signatures = set(identified)
    internal_missing: list[str] = []
    external_missing: list[str] = []
    manifest_plugins, manifest_components = manifest_dependency_sets(manifest)
    external_declared: list[str] = []
    for owner, (_component_class, _kind, dependencies) in identified.items():
        for dependency in dependencies:
            try:
                parsed = parse_signature(dependency)
            except (TypeError, ValueError):
                continue
            if (
                parsed["plugin_name"] == manifest.name
                and dependency not in expected_signatures
            ):
                internal_missing.append(f"{owner} -> {dependency}")
            elif parsed["plugin_name"] != manifest.name:
                if (
                    parsed["plugin_name"] not in manifest_plugins
                    or dependency not in manifest_components
                ):
                    external_missing.append(f"{owner} -> {dependency}")
                else:
                    external_declared.append(f"{owner} -> {dependency}")
    report.add(
        "D7",
        "内部组件依赖存在",
        FAIL if internal_missing else PASS,
        FRAMEWORK,
        "\n".join(internal_missing) or "全部存在",
    )
    report.add(
        "D8",
        "外部依赖已在 manifest 声明",
        FAIL if external_missing else PASS,
        POLICY,
        "\n".join(external_missing) or "声明完整",
    )
    if external_declared:
        report.add(
            "D8b",
            "外部组件依赖运行可用性未动态验证",
            WARN,
            RUNTIME,
            "目标插件本体真实 load/unload 已通过，但验证器不会加载依赖插件；"
            "以下依赖组件仅完成声明核对，运行可用性未动态验证：\n"
            + "\n".join(external_declared),
        )

    declared = {(item.component_type, item.component_name) for item in manifest.include}
    actual = {
        (kind.value, parse_signature(signature)["component_name"])
        for signature, (_component_class, kind, _dependencies) in identified.items()
    }
    differences = sorted(declared ^ actual)
    report.add(
        "D9",
        "manifest.include 元数据一致",
        WARN if differences else PASS,
        POLICY,
        f"差异: {differences}" if differences else "一致",
        "include 仅是元数据，不控制实际注册",
    )

    registry = get_global_registry()
    states = get_global_state_manager()
    registered = set(registry.get_by_plugin(manifest.name))
    missing = sorted(expected_signatures - registered)
    extra = sorted(registered - expected_signatures)
    inactive = sorted(
        signature
        for signature in registered
        if states.get_state(signature) != ComponentState.ACTIVE
    )
    report.add(
        "D10",
        "实际组件与预期完全一致并 ACTIVE",
        FAIL if missing or extra or inactive else PASS,
        RUNTIME,
        f"missing={missing}; extra={extra}; inactive={inactive}"
        if missing or extra or inactive
        else f"{len(registered)} 个",
    )
    plugin_signature = build_signature(
        manifest.name, ComponentType.PLUGIN, manifest.name
    )
    report.add(
        "D11",
        "插件状态 ACTIVE",
        PASS if states.get_state(plugin_signature) == ComponentState.ACTIVE else FAIL,
        RUNTIME,
        states.get_state(plugin_signature).value,
    )

    event_manager = get_event_manager()
    expected_handlers = {
        signature
        for signature, (_component_class, kind, _dependencies) in identified.items()
        if kind == ComponentType.EVENT_HANDLER
    }
    actual_handlers = {
        signature
        for signature in event_manager._handler_map
        if signature.startswith(f"{manifest.name}:")
    }
    report.add(
        "D12",
        "EventHandler 已注册",
        PASS if expected_handlers == actual_handlers else FAIL,
        RUNTIME,
        f"expected={sorted(expected_handlers)} actual={sorted(actual_handlers)}",
    )

    unloaded = await manager.unload_plugin(manifest.name)
    if lifecycle:
        unload_detail = lifecycle_results["unload"] or "钩子未执行"
        report.add(
            "L2",
            "on_plugin_unloaded 在正式 manager 上下文执行",
            PASS if lifecycle_results["unload"] == "执行完成" else FAIL,
            RUNTIME,
            unload_detail,
        )
    leaked_modules = sorted(
        name
        for name in sys.modules
        if name == plugin_dir.name or name.startswith(f"{plugin_dir.name}.")
    )
    cleanup_errors: list[str] = []
    if (
        manager.get_plugin(manifest.name) is not None
        or manifest.name in manager._manifests
        or manifest.name in manager._plugin_paths
    ):
        cleanup_errors.append("manager 记录残留")
    if registry.get_by_plugin(manifest.name):
        cleanup_errors.append("component registry 残留")
    if any(
        signature.startswith(f"{manifest.name}:")
        for signature in event_manager._handler_map
    ):
        cleanup_errors.append("EventHandler 残留")
    if is_plugin_registered(manifest.name):
        cleanup_errors.append("plugin class 残留")
    if leaked_modules:
        cleanup_errors.append(f"sys.modules 残留: {leaked_modules}")
    report.add(
        "D13",
        "PluginManager.unload_plugin 完整清理",
        PASS if unloaded and not cleanup_errors else FAIL,
        RUNTIME,
        "清理完成"
        if unloaded and not cleanup_errors
        else "; ".join(cleanup_errors) or "unload 返回 False",
    )


def worker_main(args: argparse.Namespace) -> int:
    """Execute worker and emit exactly one JSON document."""
    plugin_dir = Path(args.plugin_path).resolve()
    report = Report(plugin_path=str(plugin_dir))
    try:
        project_root = locate_project_root(plugin_dir, args.project_root)
        sys.path.insert(0, str(project_root))
        if sys.platform == "win32":
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        with tempfile.TemporaryDirectory(prefix="mofox-verify-") as temporary_cwd:
            previous_cwd = Path.cwd()
            try:
                os.chdir(temporary_cwd)
                with (
                    contextlib.redirect_stdout(io.StringIO()),
                    contextlib.redirect_stderr(io.StringIO()),
                ):
                    asyncio.run(run_worker(report, plugin_dir, args.lifecycle))
            finally:
                os.chdir(previous_cwd)
    except Exception as exc:
        report.add(
            "X0",
            "验证脚本执行",
            FAIL,
            RUNTIME,
            f"{type(exc).__name__}: {exc}\n{traceback.format_exc()}",
        )
    sys.stdout.write(json.dumps(asdict(report), ensure_ascii=False))
    return 0


def report_from_dict(data: dict[str, Any]) -> Report:
    """Build a Report from worker JSON."""
    report = Report(
        data["plugin_path"], data.get("plugin_name", ""), data.get("plugin_version", "")
    )
    report.results = [CheckResult(**item) for item in data.get("results", [])]
    report.components = data.get("components", [])
    return report


def run_parent(args: argparse.Namespace) -> tuple[Report, int]:
    """Run one disposable worker process with timeout and parse its protocol."""
    plugin_dir = Path(args.plugin_path).resolve()
    if not plugin_dir.is_dir():
        report = Report(str(plugin_dir))
        report.add("X0", "插件目录存在", FAIL, FRAMEWORK, str(plugin_dir))
        return report, 3
    command = [
        sys.executable,
        "-X",
        "utf8",
        str(Path(__file__).resolve()),
        str(plugin_dir),
        "--_worker",
    ]
    if args.project_root:
        command.extend(["--project-root", args.project_root])
    if args.lifecycle:
        command.append("--lifecycle")
    try:
        completed = subprocess.run(
            command,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=args.timeout,
            check=False,
        )
    except subprocess.TimeoutExpired:
        report = Report(str(plugin_dir))
        report.add("X0", "验证子进程超时", FAIL, RUNTIME, f"超过 {args.timeout:g} 秒")
        return report, 3
    try:
        report = report_from_dict(json.loads(completed.stdout))
    except (json.JSONDecodeError, KeyError, TypeError) as exc:
        report = Report(str(plugin_dir))
        report.add(
            "X0",
            "子进程 JSON 协议",
            FAIL,
            RUNTIME,
            f"{exc}; stdout={completed.stdout!r}; stderr={completed.stderr!r}",
        )
        return report, 3
    if completed.returncode != 0:
        report.add(
            "X1",
            "验证子进程退出",
            FAIL,
            RUNTIME,
            f"code={completed.returncode}; stderr={completed.stderr}",
        )
        return report, 3
    if report.failures:
        return report, 1
    if args.strict and report.warnings:
        return report, 2
    return report, 0


def print_console(report: Report) -> None:
    """Print a compact human-readable report."""
    print(
        f"Neo-MoFox 插件验证: {report.plugin_name or '?'} v{report.plugin_version or '?'}"
    )
    print(f"路径: {report.plugin_path}")
    for result in report.results:
        print(
            f"[{result.status:4}] [{result.category}] {result.check_id} {result.title}"
        )
        if result.detail:
            for line in result.detail.splitlines():
                print(f"       {line}")
    print(
        f"结果: {len(report.passes)} PASS | {len(report.warnings)} WARN | {len(report.failures)} FAIL"
    )


def build_parser() -> argparse.ArgumentParser:
    """Build the command-line parser."""
    parser = argparse.ArgumentParser(description="Neo-MoFox 目录插件全链路验证")
    parser.add_argument("plugin_path")
    parser.add_argument("--project-root")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--lifecycle", action="store_true")
    parser.add_argument("--strict", action="store_true")
    parser.add_argument("--timeout", type=float, default=30.0)
    parser.add_argument("--_worker", action="store_true", help=argparse.SUPPRESS)
    return parser


def main() -> int:
    """CLI entry point."""
    args = build_parser().parse_args()
    if args._worker:
        return worker_main(args)
    report, exit_code = run_parent(args)
    if args.json:
        print(json.dumps(asdict(report), ensure_ascii=False, indent=2))
    else:
        print_console(report)
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
