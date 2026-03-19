import { describe, it, expect } from '@jest/globals';
import { renderValidationEmailTemplate } from "../utils/EmailServices.js";

describe('EmailServices', () => {
    it('substitui o placeholder validationCode', () => {
        const template = '<div class="code">{{validationCode}}</div>';
        const html = renderValidationEmailTemplate(template, "123456");
        expect(html).toBe('<div class="code">123456</div>');
    });

    it('continua aceitando o placeholder legado code', () => {
        const template = "Codigo: {{code}}";
        const html = renderValidationEmailTemplate(template, "654321");
        expect(html).toBe("Codigo: 654321");
    });
});