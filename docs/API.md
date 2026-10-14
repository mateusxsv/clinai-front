# Integração com a API ClinAi

Referência conferida: `mateusxsv/clinai`, commit `170674b0cbc31a573772d7d71f7895340f46b8a5` em 7 de outubro de 2026.

## Contrato implementado no frontend

`VITE_API_BASE_URL` aponta para a raiz do Express, sem `/api`. A única operação de dados liberada nesta revisão é `GET /medicos`.

| Resposta do backend | Representação interna |
| ------------------- | --------------------- |
| `_id`               | `id`                  |
| `nome`              | `name`                |
| `especialidade`     | `specialty`           |
| `clinica`           | `clinic`              |
| `foto` (URL HTTPS)  | `image`               |

Notas, avaliações, valores e convênios não existem no modelo atual: não são preenchidos com dados fictícios. Uma lista vazia permanece vazia; erros não acionam um adaptador local. Mensagens de erro aceitam o campo `mensagem` usado pelo servidor.

As requisições têm timeout de 15 segundos. O catálogo público não envia cookies (`credentials: omit`), compatível com `cors()` atual. Isso precisará ser revisto junto à autenticação, não apenas alterado no cliente.

## Rotas existentes no backend

| Recurso      | Rotas                                | Integração nesta revisão                               |
| ------------ | ------------------------------------ | ------------------------------------------------------ |
| Médicos      | `/medicos`, `/medicos/:id`           | Leitura do catálogo                                    |
| Pacientes    | `/pacientes`, `/pacientes/:id`       | Bloqueada: falta identidade e autorização              |
| Pré-triagens | `/pre-triagens`, `/pre-triagens/:id` | Bloqueada: falta identidade e autorização              |
| Consultas    | `/consultas`, `/consultas/:id`       | Bloqueada: falta agenda, autorização e reserva atômica |

Os recursos possuem POST, GET, GET por ID, PUT e DELETE. Não são equivalentes aos endpoints em inglês propostos nas versões anteriores deste documento.

## Contratos a definir e implementar no backend

1. Cadastro e autenticação com senha protegida, sessão verificável, encerramento e recuperação de acesso. Identidade e papel devem vir do servidor.
2. Consulta e atualização do próprio perfil, com autorização em cada operação. Médico só pode acessar os pacientes e consultas que lhe cabem.
3. Disponibilidade por médico e data, fuso horário acordado e exclusão de horários já reservados.
4. Criação da pré-triagem associada ao paciente autenticado e da consulta com `paciente`, `medico`, `preTriagem`, `data` e `horario`.
5. Confirmação/cancelamento com status permitidos e reserva protegida contra concorrência no servidor.
6. Campos atualmente ausentes: e-mail e data de nascimento do paciente, histórico ampliado, revisão do resumo, eventual valor e convênio. A UI de cadastro também deverá incluir CPF e sexo exigidos pelo modelo atual.

Não basta alterar `recursos` para `true`: as operações indisponíveis em `src/servicos/api.ts` devem ser implementadas e testadas com os contratos aprovados. Elas rejeitam a chamada com erro 501 e nunca fabricam IDs ou retornos de sucesso.

## Critérios para liberar atendimento real

Validar cadastro → login → sessão → pré-triagem → reserva → confirmação → cancelamento com duas contas de pacientes e uma de médico. Verificar isolamento de dados, duas reservas concorrentes para o mesmo horário, persistência após recarregar e encerramento real da sessão. Configurar HTTPS e CORS para a origem do frontend. Não colocar credenciais do MongoDB em nenhuma variável `VITE_*`.
