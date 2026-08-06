"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSkillName = normalizeSkillName;
function normalizeSkillName(name) {
    return name
        .trim()
        .replace(/\+\+/g, '-plus-plus')
        .replace(/#/g, '-sharp')
        .replace(/\./g, '-dot-')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '');
}
//# sourceMappingURL=skill-name.util.js.map