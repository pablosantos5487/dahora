# Açaí Vivo — site completo para açaiteria

Site estático (HTML, CSS e JavaScript puro, sem dependências) com loja, montagem do açaí em 6 etapas, carrinho, cupons, checkout, pedido por WhatsApp e painel do lojista.

## Arquivos

| Arquivo | Função |
|---|---|
| `index.html` | Loja (home, cardápio, montagem, carrinho, checkout) |
| `styles.css` | Identidade visual (roxo, lilás, off-white, verde e creme), mobile-first |
| `data.js` | Configuração padrão (produtos, tamanhos, regras, cupons) e camada de dados `DB` |
| `app.js` | Lógica da loja: cálculo de preços, limites, carrinho, cupons, validações, WhatsApp |
| `admin.html`, `admin.js`, `admin.css` | Painel do lojista |

## Como testar

Abra `index.html` no navegador. Para publicar, configure a branch `main` e a pasta `/(root)` em *Settings → Pages*. Depois da publicação, a loja ficará em `https://pablosantos5487.github.io/dahora/` e o painel em `https://pablosantos5487.github.io/dahora/admin.html`.
Painel: `admin.html`. Senha inicial: `admin123`.

## Configure antes de publicar (painel → "Loja")

1. **WhatsApp**: número com DDI+DDD, só dígitos (ex.: `5551999999999`). Sem isso os pedidos não chegam à loja.
2. **Senha do painel**, nome, endereço, horário, taxa de entrega, pedido mínimo e chave PIX.
3. Produtos, preços e fotos (campo "Imagem (URL)"). Sem URL, o site usa ilustrações em SVG.

Clique em **Salvar alterações** no painel para a loja usar os novos dados.

## Regras de personalização (painel → "Tamanhos" e "Complementos")

- Cada tamanho define o preço, os **complementos grátis** e o **máximo** de complementos.
- Depois da cota grátis, cada complemento extra é cobrado pelo preço do próprio item.
- **Sempre cobrado**: item pago desde o primeiro (não usa a cota grátis).
- **Ilimitado**: grátis e fora do limite.
- **Unidades máx.**: quantas vezes o mesmo item pode ser escolhido.
- **Limite por categoria** (ex.: no máximo 2 cremes).
- Ao ultrapassar um limite, o cliente vê uma mensagem explicando o motivo.

## O que depende de integração externa

- **Pagamento online (cartão/PIX automático)**: não está incluído. Hoje o cliente escolhe a forma de pagamento (PIX, cartão na maquininha, dinheiro com troco) e o lojista confirma pelo WhatsApp. Para cobrança online é preciso contratar um gateway (Mercado Pago, Stripe, Pagar.me ou Wix Payments, se o site for hospedado na Wix) e criar um servidor/função que gere a cobrança. O ponto de encaixe é a função `submitOrder()` em `app.js`.
- **Painel central em vários aparelhos**: neste modelo, pedidos e configurações ficam no `localStorage` do navegador. Para o lojista ver pedidos de clientes em outros aparelhos, troque as funções de `DB` (em `data.js`) por chamadas a um backend (Wix Velo/CMS, Firebase, Supabase etc.). O restante do código não muda.
- **Senha do painel**: é uma proteção básica no navegador. Em produção, use autenticação de servidor.
- **CEP**: o preenchimento automático usa a API pública ViaCEP; se estiver fora do ar, o cliente digita o endereço.

## Se for usar na Wix

A Wix não executa este código como está. Opções: (a) hospedar estes arquivos em outro serviço (GitHub Pages, Netlify) e apontar o domínio; (b) incorporar com o elemento HTML/iframe da Wix; (c) recriar a lógica com Wix Velo e Wix Stores/CMS (os cálculos de `mk()` e `totals()` em `app.js` servem de base).
