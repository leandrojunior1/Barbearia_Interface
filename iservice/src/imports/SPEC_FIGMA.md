# iService — Especificação de Design (para geração de UI)

> Use este documento apenas como referência de CONTEÚDO, FLUXO e ESTILO
> visual de cada tela. Ignore qualquer menção a como os dados são
> armazenados ou processados — isso é responsabilidade da implementação
> de código, feita depois, fora do Figma.

## Sobre o produto

SaaS de marketplace e agendamento de serviços (barbearias, salões,
estética, pet shops, spas, etc). Um cliente navega o marketplace,
escolhe um estabelecimento e agenda um serviço. Cada estabelecimento
(loja) tem sua própria página pública dentro da plataforma.

Existem 3 tipos de usuário: **Cliente**, **Lojista** (dono de negócio) e
**Dev/Admin da plataforma** — cada um com sua própria área.

## Identidade visual

- **Cor de marca:** teal `#2F6B6B` (variação escura `#234F4F` para hover)
- **Fundo:** branco. Texto principal: cinza-escuro quase preto. Texto
  secundário: cinza médio.
- **Tipografia:** Playfair Display nos títulos (serif elegante, pesos
  600/700) + Work Sans no corpo (sans-serif limpa, pesos 400/500/600)
- **Vibe geral:** premium, elegante, clean, bastante espaço em branco,
  bordas arredondadas suaves (12–16px), sombras discretas — nada
  "carregado" ou saturado de cor
- Gerar em **mobile-first**, com versão desktop equivalente para as
  telas de Home e Agendamento
- Cada loja pode ter sua própria personalização visual (cor primária/
  secundária, tipografia, formato de cards) na própria página — isso é
  independente da identidade fixa da plataforma (menu global e telas
  institucionais continuam sempre com a identidade teal/Playfair/Work Sans)

## Menu Global (Header)

Presente em todas as páginas. Conteúdo: ícone "i" em fundo teal +
logotipo "iService", links de navegação (Início, Serviços, Categorias,
Contato), e à direita: botões "Entrar"/"Criar conta" (estado deslogado)
ou nome + foto do usuário (estado logado).

## Tela: Home / Marketplace

Ordem de cima para baixo:
1. Menu global
2. Hero com título + subtítulo + barra de pesquisa — a barra de
   pesquisa fica sobre um **fundo mais escuro** que o resto da página
   (um bloco/faixa escura só nessa seção)
3. Carrossel horizontal **"Destaques"** com cards de estabelecimentos
4. Carrosséis horizontais por categoria (estilo "perto de você"),
   um por categoria (ex: Barbearia, Spa, Estética) — o último item de
   um desses carrosséis é um card diferenciado de call-to-action:
   **"Anuncie aqui também sua loja"**
5. Rodapé: logotipo, breve descrição, colunas de links (Contato, Sobre
   nós, Suporte, Para lojistas) e copyright

**Card de estabelecimento:** imagem (com indicação visual de que é um
mini carrossel/possui mais fotos), nome do estabelecimento, categoria,
badges pequenos de comodidades (ex: "Café", "Estacionamento").

**Estados alternativos a gerar também:**
- Estado vazio do carrossel "Destaques" (nenhum estabelecimento em
  destaque no momento)
- Estado do usuário logado no menu global (mostrando nome/foto em vez
  dos botões)

## Tela: Página de Agendamento (de um estabelecimento)

Estrutura de cima para baixo:
1. Menu global
2. Galeria de fotos do estabelecimento — estilo carrossel de produto
   e-commerce (imagem grande principal + tira de miniaturas clicáveis
   abaixo)
3. Linha de ícones de comodidades (ex: "Espaço Kids", "Café",
   "Estacionamento", e um item "Outro" com um pequeno ícone de asterisco
   indicando informação customizada/tooltip)
4. Sistema de agendamento (ver wizard abaixo)
5. Rodapé (idêntico ao da Home)

### Wizard de agendamento — 5 etapas, sequência fixa

1. **Serviço** — cards/lista com nome, duração e preço de cada serviço
2. **Profissional** — cards com foto, nome e uma breve descrição (ex:
   "Especialista em coloração"); ao clicar na foto, ela deve indicar que
   pode ser ampliada
3. **Dia** — seletor em scroll horizontal com os próximos dias
   disponíveis; alguns dias devem aparecer **visualmente desabilitados**
   (esmaecidos/acinzentados, indicando falta de horário)
4. **Horário** — grade de horários disponíveis em formato de chips/botões
5. **Confirmação** — resumo do que foi selecionado (serviço,
   profissional, dia, horário) + botão de ação principal

**Comportamento visual do wizard:** ao selecionar uma opção em uma
etapa, ela deve colapsar/resumir visualmente (mostrando só um resumo em
uma linha), e a próxima etapa expande abaixo — a página não deve ficar
extremamente longa com tudo expandido ao mesmo tempo. Incluir um botão
flutuante "Voltar ao topo".

**Estados alternativos a gerar também:**
- Tela de sucesso pós-confirmação (ícone de check, mensagem "Seu
  agendamento foi confirmado com sucesso", texto secundário indicando
  que o usuário será redirecionado)
- Estado de uma etapa "bloqueada" (ainda não pode ser preenchida porque
  a etapa anterior não foi concluída) — visualmente acinzentada/inativa

## Tela: Login / Cadastro

Uma única tela com um seletor no topo: **"Entrar como Cliente"** /
**"Entrar como Lojista"**.

- **Modo Cliente:** botão destacado "Entrar com Google" como opção
  principal
- **Modo Lojista:** formulário tradicional com 3 campos — Usuário,
  Senha, ID

Incluir também, como telas/estados adicionais:
- **Cadastro de lojista:** formulário com Nome do estabelecimento,
  Categoria (dropdown), Endereço, Telefone, WhatsApp — e uma tela de
  confirmação de envio ("Seu cadastro está sendo analisado, entraremos
  em contato em breve") com opção de escolher a forma de contato
  preferida (Telefone / WhatsApp / E-mail)

## Tela: Painel do Lojista

Layout de **dashboard com menu lateral** (sidebar) + área de conteúdo
principal.

**Menu lateral, com estas seções:** Agendamentos, Estabelecimento,
Serviços, Profissionais, Customização, Financeiro, Suporte.

**Conteúdo principal (tela inicial do painel):** lista de agendamentos
do dia + tabelas de horário por funcionário.

Gerar também o conteúdo de pelo menos estas 3 abas como telas
separadas:
- **Agendamentos:** tabela de agendamentos organizada por profissional
- **Financeiro:** cartão com estimativa de lucro do mês e uma
  comparação percentual com a semana anterior (ex: "+15% vs semana
  passada")
- **Customização:** painel de controles para tamanho/tipo/cor de fonte,
  cor primária e secundária da loja, formato de card (quadrado/
  circular/semicírculo) e estilo (gradient ou sólido) — com uma prévia
  visual ao lado mostrando o resultado das escolhas

## Tela: Painel Master / Dev

Também em formato de dashboard operacional (sem gráficos elaborados —
mais tabelas e listas de ação).

Seções a gerar:
- **Aprovações pendentes:** lista de cadastros de lojista aguardando
  aprovação, com ações de aprovar/rejeitar
- **Gestão de lojas:** lista de lojas ativas com ação de suspender/
  desativar
- **Categorias:** lista de categorias existentes + campo para adicionar
  uma nova
- **Suporte (tickets):** lista de tickets abertos por lojistas/usuários,
  com uma visão de conversa ao abrir um ticket

## Categorias (para usar em dropdowns/filtros)

Barbearia, Salão de Beleza, Estética, Spa & Bem-estar, Manicure &
Pedicure, Depilação, Massoterapia, Tatuagem & Piercing, Academia &
Personal Trainer, Nutrição, Fisioterapia, Psicologia & Terapia,
Odontologia, Pet Shop & Veterinário, Estética Automotiva, Fotografia,
Aulas Particulares, Outro.
