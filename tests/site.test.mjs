import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { Script, runInNewContext } from "node:vm";

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


function extractFunction(source, name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "função " + name + " não encontrada");

  const bodyStart = source.indexOf("{", start);
  let depth = 0;

  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }

  assert.fail("corpo da função " + name + " não foi fechado");
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
  assert.match(javascript, /urlsImagemCardsPendentes\.add\(urlImagem\)/);
  assert.match(javascript, /liberarUrlImagemCard\(urlImagem\)/);
  assert.match(
    javascript,
    /imagem\.addEventListener\(\s*["']load["']\s*,\s*liberarUrlImagem\s*,\s*\{\s*once\s*:\s*true\s*\}\s*\)/
  );
  assert.match(
    javascript,
    /imagem\.addEventListener\(\s*["']error["']\s*,\s*liberarUrlImagem\s*,\s*\{\s*once\s*:\s*true\s*\}\s*\)/
  );
});

test("URLs de imagens ainda não carregadas são liberadas ao reconstruir a galeria", () => {
  assert.match(javascript, /limparUrlsImagemCardsPendentes\(\)\s*gradePersonagens\.replaceChildren\(\)/);
  assert.match(javascript, /window\.addEventListener\(\s*["']beforeunload["'][\s\S]*?limparUrlsImagemCardsPendentes\(\)/);

  const declaration = javascript.match(/const urlsImagemCardsPendentes=new Set\(\)/)?.[0];
  assert.ok(declaration, "registro de URLs pendentes não encontrado");

  const source = [
    declaration,
    extractFunction(javascript, "liberarUrlImagemCard"),
    extractFunction(javascript, "limparUrlsImagemCardsPendentes")
  ].join("\n");
  const revoked = [];
  const context = {
    URL: { revokeObjectURL(url) { revoked.push(url); } }
  };

  runInNewContext(source, context);
  runInNewContext([
    "urlsImagemCardsPendentes.add(\"blob:loaded\");",
    "liberarUrlImagemCard(\"blob:loaded\");",
    "urlsImagemCardsPendentes.add(\"blob:lazy-pending\");",
    "urlsImagemCardsPendentes.add(\"blob:another-pending\");",
    "limparUrlsImagemCardsPendentes();",
    "liberarUrlImagemCard(\"blob:lazy-pending\");"
  ].join("\n"), context);

  assert.deepEqual(revoked, ["blob:loaded", "blob:lazy-pending", "blob:another-pending"]);
});

test("fechar o formulário libera a URL temporária da prévia", () => {
  const cleanup = extractFunction(javascript, "limparPreviewPersonagem");
  const close = extractFunction(javascript, "fecharFormularioNovoPersonagem");
  const revoked = [];
  const preview = {
    hidden: false,
    removeAttribute(name) {
      if (name === "src") this.src = "";
    },
    src: "blob:preview"
  };
  const panel = { hidden: false };
  const button = {
    attributes: {},
    focused: false,
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    focus() {
      this.focused = true;
    }
  };
  const context = {
    URL: {
      revokeObjectURL(url) {
        revoked.push(url);
      }
    },
    previewNovoPersonagem: preview,
    painelFormularioPersonagem: panel,
    abrirFormularioPersonagem: button,
    idPersonagemEditando: 42
  };

  runInNewContext(
    ["let urlPreviewPersonagem = \"blob:preview\";", cleanup, close].join("\n"),
    context
  );
  context.fecharFormularioNovoPersonagem();

  assert.deepEqual(revoked, ["blob:preview"]);
  assert.equal(runInNewContext("urlPreviewPersonagem", context), null);
  assert.equal(preview.src, "");
  assert.equal(preview.hidden, true);
  assert.equal(panel.hidden, true);
  assert.equal(button.attributes["aria-expanded"], "false");
  assert.equal(button.focused, true);
  assert.equal(context.idPersonagemEditando, null);
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

test("operações IndexedDB só resolvem após commit e rejeitam abort", async () => {
  const source = extractFunction(javascript, "acessarPersonagens");
  const transactions = [];
  const context = {
    bancoPersonagens: {
      transaction(storeName, mode) {
        assert.equal(storeName, "personagens");
        const request = {};
        const transaction = {
          error: null,
          objectStore(name) {
            assert.equal(name, "personagens");
            return { getAll() { return request; } };
          }
        };
        transactions.push({ transaction, request, mode });
        return transaction;
      }
    }
  };

  runInNewContext(source, context);

  const committedOperation = context.acessarPersonagens("readwrite", store => store.getAll());
  const committed = transactions[0];
  committed.request.result = ["persistido"];
  committed.request.onsuccess();

  let resolvedBeforeCommit = false;
  committedOperation.then(() => { resolvedBeforeCommit = true; });
  await Promise.resolve();
  assert.equal(resolvedBeforeCommit, false, "a operação não pode resolver antes do commit");

  committed.transaction.oncomplete();
  assert.deepEqual(await committedOperation, ["persistido"]);

  const abortedOperation = context.acessarPersonagens("readwrite", store => store.getAll());
  const aborted = transactions[1];
  aborted.request.result = ["não persistido"];
  aborted.request.onsuccess();
  aborted.transaction.error = new Error("QuotaExceededError");
  aborted.transaction.onabort();

  await assert.rejects(abortedOperation, /QuotaExceededError/);
});


test("a inicialização dos personagens base evita duplicações entre abas concorrentes", async () => {
  const source = extractFunction(javascript, "garantirPersonagensIniciais");
  const registros = [];
  const transacoes = [];
  const context = {
    personagensIniciais: [
      { chave: "base-jotaro", nome: "Jotaro" },
      { chave: "base-dio", nome: "Dio" },
      { chave: "base-giorno", nome: "Giorno" },
      { chave: "base-josuke", nome: "Josuke" }
    ],
    bancoPersonagens: {
      transaction(storeName, mode) {
        assert.equal(storeName, "personagens");
        assert.equal(mode, "readwrite");
        const pendentes = [];
        const request = {};
        const transaction = {
          objectStore(name) {
            assert.equal(name, "personagens");
            return {
              getAll() { return request; },
              add(record) { pendentes.push(record); return {}; }
            };
          }
        };
        transacoes.push({ transaction, request, pendentes });
        return transaction;
      }
    }
  };

  runInNewContext(source, context);

  const primeiraInicializacao = context.garantirPersonagensIniciais();
  const segundaInicializacao = context.garantirPersonagensIniciais();
  assert.equal(transacoes.length, 2, "cada inicialização deve criar sua própria transação");

  // A segunda transação readwrite só lê após a primeira concluir.
  transacoes[0].request.result = registros.slice();
  transacoes[0].request.onsuccess();
  assert.deepEqual(
    transacoes[0].pendentes.map((item) => item.chave),
    ["base-jotaro", "base-dio", "base-giorno", "base-josuke"]
  );

  registros.push(...transacoes[0].pendentes);
  transacoes[0].transaction.oncomplete();

  transacoes[1].request.result = registros.slice();
  transacoes[1].request.onsuccess();
  assert.deepEqual(
    transacoes[1].pendentes.map((item) => item.chave),
    [],
    "a segunda inicialização deve reconhecer os registros já confirmados"
  );
  transacoes[1].transaction.oncomplete();

  await Promise.all([primeiraInicializacao, segundaInicializacao]);
  assert.equal(registros.length, 4);
  assert.equal(new Set(registros.map((item) => item.chave)).size, 4);
});

test("o player de música é carregado sob demanda em um iframe visível e acessível", () => {
  const button = getOpeningTags("button").find((attributes) =>
    getAttribute(attributes, "id") === "botaoMusica"
  );
  const container = getOpeningTags("div").find((attributes) =>
    getAttribute(attributes, "id") === "playerContainer"
  );
  const iframe = getOpeningTags("iframe").find((attributes) =>
    getAttribute(attributes, "id") === "player"
  );

  assert.ok(button, "botão da música não encontrado");
  assert.equal(getAttribute(button, "aria-controls"), "playerContainer");
  assert.equal(getAttribute(button, "aria-expanded"), "false");
  assert.ok(container && /\bhidden\b/.test(container), "player deve iniciar fechado");
  assert.ok(iframe, "iframe do YouTube não encontrado");
  assert.equal(getAttribute(iframe, "title"), "Reprodutor da música tema do JOJOs");
  assert.equal(getAttribute(iframe, "width"), "356");
  assert.equal(getAttribute(iframe, "height"), "200");
  assert.equal(getAttribute(iframe, "referrerpolicy"), "strict-origin-when-cross-origin");
  assert.doesNotMatch(iframe, /\bsrc\s*=/, "iframe não deve carregar antes da interação");
  assert.match(css, /\.player-musica\{[^}]*min-width:200px/);
  assert.match(css, /\.player-musica iframe\{[^}]*height:200px/);
  assert.doesNotMatch(javascript, /autoplay=1/, "a reprodução não deve iniciar automaticamente");

  const player = {
    src: "",
    removeAttribute(name) {
      if (name === "src") this.src = "";
    }
  };
  const containerState = { hidden: true };
  const buttonState = {
    attributes: {},
    textContent: "🎵 Música Tema",
    setAttribute(name, value) {
      this.attributes[name] = value;
    }
  };
  const context = {
    document: {
      getElementById(id) {
        return {
          player,
          playerContainer: containerState,
          botaoMusica: buttonState
        }[id];
      }
    }
  };

  runInNewContext("let playerMusicaAberto=false;\n" + extractFunction(javascript, "musica"), context);
  context.musica();

  assert.equal(containerState.hidden, false);
  assert.equal(player.src, "https://www.youtube-nocookie.com/embed/wtrFQLivuCg?playsinline=1");
  assert.equal(buttonState.attributes["aria-expanded"], "true");
  assert.equal(buttonState.textContent, "Ocultar música tema");

  context.musica();
  assert.equal(containerState.hidden, true);
  assert.equal(player.src, "");
  assert.equal(buttonState.attributes["aria-expanded"], "false");
  assert.equal(buttonState.textContent, "🎵 Música Tema");
});

test("os controles HTML não usam atributos de evento inline", () => {
  const markup = html.slice(0, html.search(/<script\b/i));
  const inlineHandlers = [...markup.matchAll(/<([a-z][\w:-]*)\b([^>]*)>/gi)]
    .flatMap(([, tag, attributes]) =>
      [...attributes.matchAll(/(?:^|\s)(on[a-z][a-z0-9_-]*)\s*=/gi)]
        .map(([attribute]) => tag + ":" + attribute.trim().replace(/\s*=.*$/, ""))
    );

  assert.deepEqual(inlineHandlers, [], "a marcação não deve conter manipuladores de eventos inline");
  assert.match(markup, /id="botaoMenu"/);
  assert.match(markup, /id="botaoAtivarStand"/);
  assert.match(javascript, /getElementById\("botaoMenu"\)\.addEventListener\("click",menu\)/);
  assert.match(javascript, /getElementById\("botaoAtivarStand"\)\.addEventListener\("click",stand\)/);
  assert.match(javascript, /getElementById\("botaoMusica"\)\.addEventListener\("click",musica\)/);
});
