# Instalação da ClinAi

A ClinAi pode ser instalada pelo navegador e aberta em uma janela própria. A implementação está no frontend `mateusxsv/clinai-front`; o backend continua atendendo pelo proxy `/api` da Vercel.

## Publicação

Execute `npm ci`, `npm test` e `npm run test:pwa`. Publique a pasta `dist` gerada por `npm run build`. O build gera automaticamente `sw.js`, com uma versão baseada no conteúdo dos arquivos. Não copie um worker antigo para um build novo.

Na Vercel, mantenha o comando `npm run build`, a saída `dist` e o `vercel.json` do repositório. O proxy `/api` é preservado, e o worker e o manifesto recebem cabeçalhos para revalidação. A instalação exige HTTPS (ou localhost para desenvolvimento). O worker não é registrado no `npm run dev`.

## Instalar

- Android e computadores compatíveis: abra Configurações → Aplicativo ClinAi → Instalar ClinAi. O botão aparece quando o navegador disponibiliza o convite. Também é possível usar o menu do navegador.
- iPhone/iPad: abra o menu de compartilhamento e escolha Adicionar à Tela de Início.
- Navegadores sem instalação continuam acessando normalmente pelo site.

A instalação não exige mudanças no banco de dados nem a criação de contas novas.

## Sem internet

Depois da primeira visita com internet e da instalação do worker, uma navegação sem rede exibe uma página de reconexão. Se o site já estiver aberto, um aviso informa a perda de conexão. Login, consultas, pré-triagem e agendamentos dependem da API; nenhuma operação é enfileirada ou confirmada offline.

O cache do worker é uma lista fechada de arquivos públicos produzidos pelo build: JavaScript, CSS, fontes, ícones, manifesto e página offline. HTML de telas autenticadas, chamadas `/api`, respostas com dados pessoais, fotos externas e operações de escrita não são armazenados. As requisições da API também usam `cache: no-store` para evitar armazenamento no cache HTTP do navegador. Isso não altera as preferências locais já existentes.

## Atualizações

Uma versão nova aguarda a escolha Atualizar agora. Conclua os formulários antes de atualizar: a ação recarrega a aba. Não há recarregamento automático durante o preenchimento. Caches de outras aplicações no mesmo domínio são preservados.

## Verificar

1. Execute `npm run test:pwa` para compilar e validar a lista de arquivos, o isolamento da API, o fallback offline e a atualização voluntária.
2. Execute `npm run preview` e abra o endereço localhost indicado pelo Vite.
3. Nas ferramentas do navegador, confira Application → Manifest e Service Workers. Visite uma vez online; depois ative Offline e atualize `/consultas`. Deve aparecer a tela de reconexão, sem dados clínicos em Cache Storage.
4. Desative Offline, tente novamente e confira o retorno do site. Teste a instalação no Android e no iOS; a disponibilidade do convite depende do navegador.
5. Para testar uma atualização, mantenha uma aba aberta, gere e sirva um segundo build e volte à aba. O aviso deve aparecer sem apagar o formulário; só o clique em Atualizar agora recarrega.

Não inclui notificações push, publicação em lojas ou sincronização de consultas offline.

Referências: [Instalação de PWAs](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) e [Service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers).
