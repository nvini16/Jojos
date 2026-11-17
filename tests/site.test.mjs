import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Script } from "node:vm";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

const inlineScripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(([, attributes]) => !/\bsrc\s*=/i.test(attributes))
  .map(([, , source]) => source);

const javascript = inlineScripts.join("\n");
const css = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
  .map(([, source]) => source)
  .join("\n");

function getAttribute(attributes, name) {
  const match = attributes.match(
    new RegExp(`(?:^|\\s)${name}\\s*=\\s*(["'])(.*?)\\1`, "i")
  );

  return match?.[2] ?? null;
}

function getOpeningTags(name) {
  return [...html.matchAll(new RegExp(`<${name}\\b([^>]*)>`, "gi"))]
    .map(([, attributes]) => attributes);
}

test("os scripts JavaScript embutidos possuem sintaxe válida", () => {
  assert.ok(inlineScripts.length > 0, "nenhum script JavaScript embutido foi encontrado");

  for (const source of inlineScripts) {
    assert.doesNotThrow(() => new Script(source));
  }
});

test("o atalho de teclado aponta para o único landmark principal", () => {
  const skipLink = getOpeningTags("a").find((attributes) =>
    (getAttribute(attributes, "class") ?? "").split(/\s+/).includes("pular-conteudo")
  );
  const mainLandmarks = getOpeningTags("main");

  assert.ok(skipLink, "atalho para pular a navegação não encontrado");

  const href = getAttribute(skipLink, "href");
  assert.ok(href?.startsWith("#"), "atalho precisa apontar para uma âncora interna");
  assert.equal(mainLandmarks.length, 1, "a página deve possuir exatamente um landmark main");
  assert.equal(getAttribute(mainLandmarks[0], "id"), href.slice(1));
  assert.equal(getAttribute(mainLandmarks[0], "tabindex"), "-1");
});

test("os IDs HTML são únicos e os rótulos apontam para elementos existentes", () => {
  const ids = [...html.matchAll(/\bid\s*=\s*(["'])(.*?)\1/gi)]
    .map(([, , id]) => id);
  const uniqueIds = new Set(ids);

  assert.equal(uniqueIds.size, ids.length, "foram encontrados IDs HTML duplicados");

  const labels = getOpeningTags("label");
  for (const attributes of labels) {
    const target = getAttribute(attributes, "for");
    if (target) {
      assert.ok(uniqueIds.has(target), `o rótulo referencia o ID inexistente "${target}"`);
    }
  }
});

test("a preferência por movimento reduzido desativa animações, transições e rolagem suave", () => {
  assert.match(css, /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/i);
  assert.match(css, /animation\s*:\s*none\s*!important/i);
  assert.match(css, /transition\s*:\s*none\s*!important/i);
  assert.match(css, /scroll-behavior\s*:\s*auto\s*!important/i);
});

test("URLs temporárias das imagens dos cartões são liberadas em sucesso e falha", () => {
  assert.match(
    javascript,
    /imagem\.addEventListener\(\s*["']load["']\s*,\s*liberarUrlImagem\s*,\s*\{\s*once\s*:\s*true\s*\}\s*\)/
  );
  assert.match(
    javascript,
    /imagem\.addEventListener\(\s*["']error["']\s*,\s*liberarUrlImagem\s*,\s*\{\s*once\s*:\s*true\s*\}\s*\)/
  );
});

test("o diálogo de perfil mantém fechamento e restauração de foco", () => {
  assert.match(javascript, /dialogoPersonagem\.showModal\(\)/);
  assert.match(javascript, /dialogoPersonagem\.addEventListener\(\s*["']close["']/);
  assert.match(javascript, /ultimoBotaoPerfil\.focus\(\)/);
});

test("o indicador de novidade possui registro de versão e dispensa reutilizável", () => {
  assert.match(javascript, /function registrarNovidade\(id,versao\)/);
  assert.match(javascript, /localStorage\.getItem\(chave\)/);
  assert.match(javascript, /localStorage\.setItem\(chave,versao\)/);
  assert.match(javascript, /function dispensarNovidade\(id\)/);
});

test("o JavaScript não utiliza sinks comuns de injeção HTML ou execução dinâmica", () => {
  assert.doesNotMatch(
    javascript,
    /\b(?:innerHTML|outerHTML|insertAdjacentHTML)\b|\bdocument\.write\s*\(|\beval\s*\(|\bnew\s+Function\s*\(/
  );
});
