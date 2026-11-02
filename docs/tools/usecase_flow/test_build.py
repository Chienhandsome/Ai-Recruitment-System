"""Regression checks for module discovery and validation before generation."""

import argparse
import contextlib
import io
import re
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import build


class BuildTests(unittest.TestCase):
    def test_catalog_and_tool_register_the_same_modules(self):
        catalog = (build.SPEC_ROOT / "00-module.md").read_text(encoding="utf-8")
        pairs = dict(re.findall(r"^\| ([A-Z]+) \| ([a-z-]+) \|", catalog, re.M))
        self.assertEqual(pairs, build.PREFIX_TO_MODULE)

    def test_registered_prefixes_resolve_to_their_modules(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for prefix, module in build.PREFIX_TO_MODULE.items():
                folder = root / module / "use-cases"
                folder.mkdir(parents=True)
                (folder / f"{prefix}-UC-001_sample.md").write_text("", encoding="utf-8")
            with patch.object(build, "SPEC_ROOT", root):
                units, errors = build.discover()
            self.assertEqual(errors, [])
            self.assertEqual(len(units), len(build.PREFIX_TO_MODULE))
            self.assertEqual(build.resolve(units, ["CV-UC-001"])[0].module, "resumes")

    def test_unknown_and_wrong_module_prefixes_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            folder = root / "resumes"
            folder.mkdir()
            (folder / "ZZZ-UC-001_sample.md").write_text("", encoding="utf-8")
            (folder / "APP-UC-001_sample.md").write_text("", encoding="utf-8")
            with patch.object(build, "SPEC_ROOT", root):
                _, errors = build.discover()
            self.assertEqual(len(errors), 2)
            self.assertTrue(any("ZZZ" in error for error in errors))
            self.assertTrue(any("applications" in error for error in errors))

    def test_main_flow_cannot_pass_without_numbered_steps(self):
        source = next((build.SPEC_ROOT / "resumes/use-cases").glob("CV-UC-001_*.md"))
        content = source.read_text(encoding="utf-8")
        content = re.sub(r"(?<=\| )\d+\. ", "", content)
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / source.name
            path.write_text(content, encoding="utf-8")
            unit = build.Unit("resumes", "CV-UC-001", md=[path])
            units, _ = build.discover()
            errors = build.validate_markdown(unit, *build.get_defined_ids(units))
            self.assertTrue(any("ít nhất một bước" in error for error in errors))

    def test_invalid_source_stops_build_before_output_is_written(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "spec/resumes/CV-UC-001_sample.md"
            source.parent.mkdir(parents=True)
            source.write_text("invalid", encoding="utf-8")
            output = root / "output"
            args = argparse.Namespace(targets=[], no_png=True, only="diagrams")
            with (
                patch.object(build, "SPEC_ROOT", root / "spec"),
                patch.object(build, "OUTPUT_ROOT", output),
                contextlib.redirect_stdout(io.StringIO()),
            ):
                self.assertEqual(build.cmd_build(args), 1)
            self.assertFalse(output.exists())


if __name__ == "__main__":
    unittest.main()
