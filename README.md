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

## Funcionalidades

- Navegação por seções com rolagem suave e indicação da seção ativa.
- Galeria com busca por nome.
- Cartões interativos com ações de perfil, edição, exclusão e ativação de Stand.
- Perfis dos quatro personagens iniciais com parte da obra, nome do Stand e descrição.
- Cadastro de personagens personalizados com imagem local.
- Favoritos persistentes e filtro combinado com a busca.
- Efeitos visuais de ativação de Stand com tratamento para preferência por movimento reduzido.
- Reprodução de música tema mediante interação do visitante.

## Armazenamento e privacidade

Os dados são armazenados localmente no navegador:

- Personagens personalizados e imagens: IndexedDB, banco `jojos-personagens`.
- Favoritos: localStorage, chave `jojos-favoritos-v1`.

Esses dados não são sincronizados entre dispositivos nem enviados a um servidor pelo aplicativo. Limpar os dados do site ou trocar de navegador/perfil pode remover ou tornar os registros inacessíveis.

Os perfis dos personagens personalizados exibem nome e imagem; informações específicas sobre o Stand ainda não são cadastradas pelo formulário.

## Acessibilidade e compatibilidade

O projeto inclui foco visível, controles com rótulos acessíveis, suporte a teclado em interações principais e respeito à preferência `prefers-reduced-motion`. O perfil individual utiliza o elemento nativo HTML `<dialog>` com abertura modal, fechamento por botão ou tecla Escape e retorno do foco ao controle que abriu a janela.

## Estrutura atual

A implementação ainda está concentrada em `index.html`, incluindo marcação, estilos e scripts. A separação em arquivos próprios de CSS e JavaScript pode ser feita gradualmente, acompanhada de testes para evitar regressões.

## Limitações conhecidas

- As imagens dos personagens iniciais usam miniaturas hospedadas externamente. Esses endereços podem deixar de funcionar; hospedagem local com fontes e permissões adequadas é uma melhoria pendente.
- Ainda não há suíte automatizada de testes nem workflow de integração contínua.
- O repositório não declara uma licença. A publicação pública não concede, por si só, permissão para reutilizar ou redistribuir o código e os recursos.
