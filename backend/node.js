import express from 'express'; //framework principal para criar o servidor e as rotas HTTP facilmente.
import mysql from 'mysql2'; //permite ao Node.js conversar e executar comandos no banco de dados MySQL.
import cors from 'cors'; //comunicação entre o frontend e o backend por meio da porta.
import bodyParser from 'body-parser'; //lê as informações enviadas pelo frontend no corpo da requisição e as transforma em um objeto JavaScript compreensível.

const app = express(); //Inicializa o Express e guarda todas as funções dele nessa constante app.

//O origin: '*' avisa ao navegador que qualquer site pode fazer requisições para a API. Os methods listam quais ações HTTP são permitidas.
app.use(cors({
    origin: '*', // Permite que qualquer origem acesse (ideal para desenvolvimento)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


// Aumentando o limite para suportar o envio das fotos em Base64 (LONGTEXT)
app.use(bodyParser.json({ limit: '1000mb' }));
app.use(bodyParser.urlencoded({ limit: '1000mb', extended: true }));

// Conexão com o Banco de Dados
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      
    password: '',      // Coloque a senha do seu MySQL aqui
    database: 'bloco_notas'
});

db.connect(err => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        return;
    }
    console.log('Conectado ao banco de dados MySQL.');
    //Se houver um erro (ex: MySQL desligado), exibe a mensagem de erro no terminal e o return impede o resto do código de rodar. Se der certo, avisa no console.

    //dispara um comando direto para as configurações do MySQL para aumentar o tamanho máximo de pacotes de dados que ele aceita receber de uma vez só (max_allowed_packet), evitando que o banco recuse salvar fotos grandes.
    db.query("SET GLOBAL max_allowed_packet = 1073741824;", (err) => {
        if (err) console.error("Erro ao aumentar limite do MySQL:", err);
        else console.log("Limite do MySQL aumentado para 1000MB!");
    });

});

// 1. ROTA DE CADASTRO
app.post('/api/cadastro', (req, res) => {

    console.log("Dados recebidos no cadastro:", req.body); // Verificar se está tudo sendo enviado.

    //O req (Request) traz o que veio da internet; o res (Response) é o que o servidor responde. O comando const { ... } = req.body extrai os dados enviados pelo formulário do frontend de dentro do corpo da requisição.
    const { email, senha, foto } = req.body;

    //Prepared Statements: uma técnica de segurança vital que impede ataques de invasão conhecidos como SQL Injection. Se der erro na estrutura da query, responde com status 500 (Erro interno do Servidor).
    db.query('SELECT email FROM usuarios WHERE email = ?', [email], (err, results) => { //função de callback (ou de retorno).
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) {
            return res.status(400).json({ message: 'Este e-mail já está cadastrado!' });
        }

        db.query('INSERT INTO usuarios (email, senha, foto) VALUES (?, ?, ?)', 
        [email, senha, foto], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
        });
    });
});

// 2. ROTA DE LOGIN
app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;

    //Tenta buscar no banco um registro onde o e-mail E a senha batam perfeitamente com o que o usuário digitou
    db.query('SELECT email, foto FROM usuarios WHERE email = ? AND senha = ?', [email, senha], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) {
            return res.status(401).json({ message: 'E-mail ou senha incorretos!' });
        }
        res.json({ message: 'Login bem-sucedido!', user: results[0] });
    });
});

// 3. ROTA PARA BUSCAR DETALHES DO USUÁRIO (Foto de Perfil)
//Uma rota do tipo GET (usada para ler dados). O trecho :email na URL é um parâmetro dinâmico. Significa que se o frontend chamar /api/usuario/teste@gmail.com, o valor teste@gmail.com fica salvo dentro de req.params.email para ser usado na busca SQL.
app.get('/api/usuario/:email', (req, res) => {
    db.query('SELECT foto FROM usuarios WHERE email = ?', [req.params.email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'Usuário não encontrado' });
        res.json(results[0]);
    });
});

//CRUD significa Criar (Create), Ler (Read), Atualizar (Update) e Deletar (Delete).

// 4. ROTA PARA BUSCAR ANOTAÇÕES DO USUÁRIO
app.get('/api/anotacoes/:email', (req, res) => {
    //Seleciona todas as colunas (*) da tabela de anotações que pertençam ao e-mail enviado por parâmetro. O ORDER BY id DESC faz com que as notas mais recentes (com maior ID) apareçam primeiro na tela.
    //DESC: Define a direção da ordenação como decrescente (do maior para o menor).
    db.query('SELECT * FROM anotacoes WHERE usuario_email = ? ORDER BY id DESC', [req.params.email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 5. ROTA PARA CRIAR ANOTAÇÃO
app.post('/api/anotacoes', (req, res) => {
    const { titulo, data_criacao, conteudo, imagem, usuario_email } = req.body;
    db.query('INSERT INTO anotacoes (titulo, data_criacao, conteudo, imagem, usuario_email) VALUES (?, ?, ?, ?, ?)',
    [titulo, data_criacao, conteudo, imagem, usuario_email], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Anotação criada!', id: result.insertId });
        //Ao responder com sucesso, ele anexa o result.insertId, que é o número de ID auto-incrementado que o MySQL acabou de gerar para aquela nota específica
    });
});

// 6. ROTA PARA EDITAR ANOTAÇÃO
//Usa o método PUT (atualização). Ele lê o ID dinâmico da URL (req.params.id) e roda um comando UPDATE alterando os valores de título, data e conteúdo apenas daquela linha específica do ID.
app.put('/api/anotacoes/:id', (req, res) => {
    const { titulo, data_criacao, conteudo } = req.body;
    db.query('UPDATE anotacoes SET titulo = ?, data_criacao = ?, conteudo = ? WHERE id = ?',
    [titulo, data_criacao, conteudo, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Anotação atualizada com sucesso!' });
    });
});

// 7. ROTA PARA DELETAR ANOTAÇÃO
//Escuta requisições do tipo DELETE. Vai na tabela de anotações e remove permanentemente a linha cujo ID corresponda ao enviado pela URL.
app.delete('/api/anotacoes/:id', (req, res) => {
    db.query('DELETE FROM anotacoes WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Anotação excluída com sucesso!' });
    });
});

//Para o Express ficar "escutando" a porta de rede 5500. 
// Quando ele consegue ocupar essa porta do sistema operacional, executa essa função mostrando as instruções no terminal.
app.listen(5500, () => {
    console.log('Servidor rodando perfeitamente em http://localhost:5500');
    console.log('Para desligar o servidor: ctrl + c');
});

/*Requisições POST e PUT são métodos HTTP usados para enviar dados a um servidor. A diferença principal está na finalidade: o POST é usado para criar novos recursos (e pode ser enviado várias vezes), enquanto o PUT serve para atualizar ou substituir um recurso existente (e deve ser executado da mesma forma mesmo se repetido)

A API é uma interface que permite que dois sistemas independentes conversem entre si. Ela define um conjunto de regras, caminhos (rotas) e funções para que uma aplicação acesse dados ou recursos de outra.

O Middleware (como o próprio nome diz: "software do meio") é uma função ou um bloco de código que fica no meio do caminho entre a requisição enviada pelo usuário e a rota final da API. Ele intercepta a requisição, analisa ou modifica os dados e decide se ela pode continuar ou se deve ser bloqueada.
*/