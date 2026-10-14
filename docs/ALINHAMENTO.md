# Alinhamento com o backend

Revisão de 7 de outubro de 2026 sobre `mateusxsv/clinai@170674b0cbc31a573772d7d71f7895340f46b8a5`.

O frontend foi reorganizado em português e a leitura de médicos agora segue `/medicos` e os campos do Mongoose. A mudança de nomes de pastas não faz a integração sozinha: o contrato HTTP e as regras no servidor são o que conecta os projetos.

## Pendências que impedem atendimento real

- Ausência de autenticação, sessão, recuperação de senha e autorização nos CRUDs. Não usar listagem global de pacientes/consultas para simular login ou filtrar dados sensíveis apenas no navegador.
- Ausência de disponibilidade por médico/data e de proteção contra reservas concorrentes.
- `src/controller/consultaController.js`: `listarConsultas` não aguarda a query com `await` antes de responder.
- `src/controller/preTriagemController.js`: a resposta de não encontrado usa variável `error` fora do `catch` e deve encerrar com `return`.
- `src/config/database.js`: imprime `process.env.MONGODB_URI`. Remover essa linha para não expor a senha nos logs; substituir credenciais já expostas.
- Atualizações precisam de lista explícita de campos permitidos, validação e `runValidators: true`, além da autorização por usuário.
- `src/server.js` inicia o servidor sem aguardar a conexão com o banco. Tratar falha de conexão e disponibilizar verificação de saúde.
- O modelo de paciente exige CPF, idade e sexo, enquanto o formulário de conta espera e-mail, senha, nascimento e telefone. Definir o modelo de identidade antes de liberar cadastro.
- Consulta exige uma pré-triagem; alinhar esse requisito com a UI e decidir a operação atômica para evitar registros órfãos.

O frontend removeu o modo simulado. As operações ausentes estão explicitamente indisponíveis e as telas de autenticação não coletam dados até haver implementação segura. O catálogo depende de configurar a URL pública ou local do Express.

Nenhuma credencial foi adicionada ao frontend, e não foi feita conexão com o Atlas nesta revisão. O documento oficial do Google Docs não foi relido nesta tarefa; este alinhamento se baseia no código dos dois repositórios.

Veja [o contrato atual e os próximos passos](API.md).
