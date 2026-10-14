# Desenvolvimento do frontend ClinAi

React, TypeScript e Vite. A apresentação institucional está no [README](../README.md).

## Executar

Use uma versão atual do Node.js 22 e o lockfile do repositório.

```bash
npm ci
cp .env.example .env
npm run dev
```

Defina `VITE_API_BASE_URL` com o endereço **HTTP do servidor Express**. Para o backend local na porta padrão, use `http://localhost:3000`, sem `/api`. Em celular, `localhost` aponta para o próprio celular; use o endereço do computador na rede. Em produção, use a URL HTTPS pública da API e gere um novo build após alterar a variável.

```bash
npm test
npm run build
npm run preview
```

Sem API configurada, o site abre normalmente e mostra um erro recuperável ao consultar profissionais. Não existe modo de demonstração nem fallback com médicos, contas ou consultas locais. `VITE_API_MODE` foi removida.

## Organização

| Caminho                         | Responsabilidade                                                         |
| ------------------------------- | ------------------------------------------------------------------------ |
| `src/componentes/interface.tsx` | Componentes, navegação e estados de interface                            |
| `src/componentes/VLibras.tsx`   | Carregamento opcional do tradutor                                        |
| `src/dominio/tipos.ts`          | Tipos internos e interface de serviços                                   |
| `src/dominio/saude.ts`          | Valores iniciais dos formulários                                         |
| `src/paginas/`                  | Autenticação, paciente, médico, agendamento, pré-triagem e configurações |
| `src/servicos/api.ts`           | Contrato HTTP e adaptação dos dados do backend                           |
| `src/estado.tsx`                | Estado da interface e preferências                                       |
| `src/testes/`                   | Testes do contrato e da interface                                        |
| `src/estilos.css`               | Paleta, responsividade e acessibilidade                                  |
| `src/principal.tsx`             | Rotas e inicialização                                                    |

Nomes convencionais exigidos pelas ferramentas (`package.json`, `index.html`, `tsconfig.json`, `vite.config.ts`, `src`, `public`) foram preservados. Os tipos de apresentação ainda possuem propriedades internas em inglês; o adaptador converte os campos reais em português, sem exigir mudanças no backend para listar médicos.

## O que funciona nesta revisão

- Catálogo conectado a `GET /medicos`, com busca, especialidades e favoritos neste navegador.
- Estados de carregamento, lista vazia, erro de rede e nova tentativa.
- Configurações acessíveis antes do login, temas claro/escuro/automático e preferências persistentes.
- Checkbox geral para recursos extras, texto ampliado, contraste, redução de movimento e opção de Libras.
- Teclado, foco e zoom continuam disponíveis quando os recursos extras estão desativados.

O script oficial do VLibras só é carregado após a opção do usuário. Desativar oculta o widget; não descarrega código de terceiros já executado. Para descarregar completamente, desative e recarregue a página. [Documentação oficial](https://vlibras.gov.br/doc/widget/installation/webpageintegration.html).

## Integração ainda pendente

Login, cadastro, recuperação, sessões, agenda e agendamentos **não estão liberados**. O backend atual não tem autenticação, autorização por usuário nem disponibilidade. As telas foram preservadas para integração futura, mas não produzem sucesso falso nem guardam dados clínicos como se estivessem salvos no banco.

Confira [API](API.md) e [alinhamento com o backend](ALINHAMENTO.md). Concluir esses serviços e validá-los em ambiente integrado é necessário antes de apresentar o produto como pronto para atendimento real.

## Dados e publicação

Somente preferências e IDs de favoritos ficam no armazenamento local. Sessões e dados da antiga demonstração são limpos do `sessionStorage`. O frontend não armazena senhas, históricos ou consultas nesse armazenamento.

`MONGODB_URI` deve ser definida exclusivamente no ambiente do backend. Nunca use `VITE_MONGODB_URI`. Credenciais compartilhadas devem ser substituídas no Atlas e retiradas dos logs do servidor.

O servidor estático precisa redirecionar rotas do frontend para `index.html` (BrowserRouter). Não publique a API clínica atual para uso real antes de implementar autenticação e autorização. Nesta revisão não foram feitas conexão com o Atlas, implantação nem alterações no repositório do backend.

## Validação

Os testes verificam respostas HTTP controladas, contrato de médicos, ausência de dados inventados, indisponibilidade explícita dos fluxos pendentes, persistência das preferências e ativação opcional de Libras. O build verifica TypeScript e geração dos arquivos de produção. Esses testes não demonstram conexão com o banco, envio de e-mails ou reserva real.
