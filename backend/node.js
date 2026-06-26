import express from 'express';
import { createConnection } from 'mysql2/promise';
import cors from 'cors';

const app = express();
// Permite receber imagens em formato Base64 (textos longos)
app.use(express.json({ limit: '50mb' })); 
app.use(cors());

const dbConfig = { host: 'localhost', user: 'root', password: '', database: 'bloco_notas' };
let connection;

async function connectToDatabase() {
    if (!connection) connection = await createConnection(dbConfig);
    return connection;
}

/* FUNCIONALIDADES DE USUÁRIO */

// 1. Cadastrar Usuário (Com verificação de existência)
app.post('/usuarios', async (req, res) => {
    const { nome, email, senha, foto } = req.body;
    try {
        const conn = await connectToDatabase();
        
        // Verifica se o e-mail já existe
        const [existe] = await conn.execute('SELECT email FROM usuarios WHERE email = ?', [email]);
        if (existe.length > 0) {
            return res.status(400).send('Este e-mail já está cadastrado!');
        }

        await conn.execute(
            'INSERT INTO usuarios (nome, email, senha, foto) VALUES (?, ?, ?, ?)', 
            [nome, email, senha, foto]
        );
        res.status(201).send('Usuário cadastrado com sucesso!');
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// 2. Verificar Senha / Login
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const conn = await connectToDatabase();
        const [rows] = await conn.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
        
        if (rows.length === 0) {
            return res.status(44).send('Usuário não encontrado.');
        }

        const usuario = rows[0];
        if (usuario.senha !== senha) {
            return res.status(401).send('Senha incorreta.');
        }

        // Retorna os dados do usuário para o Front-end salvar na sessão
        res.json({ nome: usuario.nome, email: usuario.email, foto: usuario.foto });
    } catch (error) {
        res.status(500).send(error.message);
    }
});


/* FUNCIONALIDADES DE ANOTAÇÕES */

// 3. Adicionar Nota
app.post('/anotacoes', async (req, res) => {
    const { titulo, conteudo, imagem, usuario_email } = req.body;
    const data_criacao = new Date().toISOString().split('T')[0]; // Data atual (AAAA-MM-DD)
    try {
        const conn = await connectToDatabase();
        await conn.execute(
            'INSERT INTO anotacoes (titulo, data_criacao, conteudo, imagem, usuario_email) VALUES (?, ?, ?, ?, ?)',
            [titulo, data_criacao, conteudo, imagem, usuario_email]
        );
        res.status(201).send('Nota criada com sucesso!');
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// 4. Visualizar / Listar Notas de um usuário específico
app.get('/anotacoes/:email', async (req, res) => {
    try {
        const conn = await connectToDatabase();
        const [rows] = await conn.execute(
            'SELECT * FROM anotacoes WHERE usuario_email = ? ORDER BY id DESC', 
            [req.params.email]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// 5. Editar Nota
app.put('/anotacoes/:id', async (req, res) => {
    const { titulo, conteudo, imagem } = req.body;
    try {
        const conn = await connectToDatabase();
        await conn.execute(
            'UPDATE anotacoes SET titulo = ?, conteudo = ?, imagem = ? WHERE id = ?',
            [titulo, conteudo, imagem, req.params.id]
        );
        res.send('Nota atualizada com sucesso!');
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// 6. Excluir Nota
app.delete('/anotacoes/:id', async (req, res) => {
    try {
        const conn = await connectToDatabase();
        await conn.execute('DELETE FROM anotacoes WHERE id = ?', [req.params.id]);
        res.send('Nota excluída com sucesso!');
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.listen(3000, () => console.log('Servidor rodando em http://localhost:3000'));