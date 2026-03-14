import test from "node:test";
import assert from "node:assert/strict";
import { renderValidationEmailTemplate } from "../utils/EmailServices.js";

test("renderValidationEmailTemplate substitui o placeholder validationCode", () => {
    const template = '<div class="code">{{validationCode}}</div>';

    const html = renderValidationEmailTemplate(template, "123456");

    assert.equal(html, '<div class="code">123456</div>');
});

test("renderValidationEmailTemplate continua aceitando o placeholder legado code", () => {
    const template = "Codigo: {{code}}";

    const html = renderValidationEmailTemplate(template, "654321");

    assert.equal(html, "Codigo: 654321");
});