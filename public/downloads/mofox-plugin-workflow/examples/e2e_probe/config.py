"""e2e_probe 配置定义。"""

from __future__ import annotations

from typing import ClassVar

from src.app.plugin_system.base import BaseConfig, Field, SectionBase, config_section


class ProbeConfig(BaseConfig):
    """e2e_probe 配置。"""

    name: ClassVar[str] = "config"
    description: ClassVar[str] = "关键词提醒配置"

    @config_section("general", title="常规设置", tag="general")
    class GeneralSection(SectionBase):
        """常规配置。"""

        enabled: bool = Field(
            default=True,
            description="是否启用插件",
            label="启用",
            tag="general",
        )
        notify_template: str = Field(
            default="检测到关键词：{keyword}",
            description="提醒文案模板，支持 {keyword} 占位符",
            label="提醒模板",
            tag="general",
        )

    general: GeneralSection = Field(default_factory=GeneralSection)
