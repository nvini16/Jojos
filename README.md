# JOJOs — JoJo's Bizarre Adventure

Projeto estático de galeria interativa inspirado em *JoJo's Bizarre Adventure*. O site reúne personagens, efeitos de Stand e recursos de personalização executados diretamente no navegador.

## Tecnologias

- HTML5
- CSS3
- JavaScript sem framework ou dependências externas
- IndexedDB para personagens personalizados e imagens
- localStorage para favoritos
- GitHub Pages para publicação

Não há etapa de build ou instalação de pacotes.

## Como executar

Abra o arquivo `index.html` em um navegador moderno ou acesse a versão publicada:

- https://nvini16.github.io/Jojos/

## Testes automatizados

Os testes estáticos usam o test runner nativo do Node.js e não exigem dependências adicionais.

Para executá-los localmente, com Node.js 24 ou compatível:

```bash
node --test
```

O workflow de qualidade executa os mesmos testes em cada push e em pull requests direcionados à branch `main`. Eles verificam contratos estruturais e trechos críticos do JavaScript, mas não substituem testes em navegador, testes visuais ou auditorias com tecnologias assistivas.

## Funcionalidades

- Navegação por seções com rolagem suave e indicação da seção ativa.
- Galeria com busca por nome.
- Cartões interativos com ações de perfil, edição, exclusão e ativação de Stand.
- Perfis dos quatro personagens iniciais com parte da obra, nome do Stand e descrição.
- Cadastro e edição de personagens personalizados com imagem local, nome do Stand e descrição/habilidades opcionais.
- Favoritos persistentes e filtro combinado com a busca.
- Indicadores verdes reutilizáveis de novidade, exibidos na primeira visita após uma publicação e dispensados ao abrir a funcionalidade ou na próxima visita.
- Efeitos visuais de ativação de Stand com tratamento para preferência por movimento reduzido.
- Player da música tema carregado sob demanda, visível e com controles próprios; usa o domínio de privacidade aprimorada do YouTube.

## Armazenamento e privacidade

Os dados são armazenados localmente no navegador:

- Personagens personalizados e imagens: IndexedDB, banco `jojos-personagens`.
- O formulário de cadastro só é habilitado após a inicialização do banco. Atualizações bloqueadas por outra aba são comunicadas, e conexões antigas são fechadas para permitir migrações futuras.
- Os quatro personagens iniciais são verificados e inseridos em uma única transação de escrita, evitando duplicações quando mais de uma aba inicia o site ao mesmo tempo.
- Favoritos: localStorage, chave `jojos-favoritos-v1`.

Esses dados não são sincronizados entre dispositivos nem enviados a um servidor pelo aplicativo. Limpar os dados do site ou trocar de navegador/perfil pode remover ou tornar os registros inacessíveis.

Os perfis dos personagens personalizados exibem nome e imagem. O formulário também permite informar, opcionalmente, o nome do Stand e uma descrição de até 500 caracteres com habilidades ou outras informações. Registros antigos sem esses campos continuam compatíveis e aparecem com o Stand como não informado.

## Acessibilidade e compatibilidade

O projeto inclui foco visível, atalho de teclado para pular a navegação e acessar o conteúdo principal (`<main>`), controles com rótulos acessíveis, suporte a teclado nas interações principais, anúncios textuais dos efeitos de Stand em uma região de status persistente, separada da camada visual animada e respeito à preferência `prefers-reduced-motion`. O perfil individual utiliza o elemento nativo HTML `<dialog>` com abertura modal, fechamento por botão ou tecla Escape e retorno do foco ao controle que abriu a janela. Os controles principais são vinculados por `addEventListener`, sem atributos de evento inline. Como estilos e scripts ainda estão embutidos, uma Content Security Policy (CSP) restritiva depende de uma externalização posterior.

## Estrutura atual

A implementação ainda está concentrada em `index.html`, incluindo marcação, estilos e scripts. A separação em arquivos próprios de CSS e JavaScript pode ser feita gradualmente, acompanhada de testes para evitar regressões.

## Limitações conhecidas

- As imagens dos personagens iniciais usam miniaturas hospedadas externamente. Esses endereços podem deixar de funcionar; hospedagem local com fontes e permissões adequadas é uma melhoria pendente.
- Ao abrir o player de música, o navegador se conecta ao YouTube. O domínio de privacidade aprimorada reduz a personalização baseada no conteúdo incorporado, mas não elimina a comunicação com o serviço.
- Ainda não há testes de interação em navegador nem auditoria automatizada de acessibilidade. A suíte atual cobre verificações estáticas e contratos selecionados do JavaScript, incluindo a confirmação do commit e o tratamento de abortos nas operações IndexedDB.
- O repositório não declara uma licença. A publicação pública não concede, por si só, permissão para reutilizar ou redistribuir o código e os recursos.
