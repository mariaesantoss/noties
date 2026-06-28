// const express = require('express');
// const mysql = require('mysql2');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const http = require('http');

// const server = https.createServer((req,res) =>{
//     res.end('<h1>Foi!</h1>')
// });

// server.listen(8080, 'localhost', ()=> {
//     console.log('Servidor de pé em: https://localhost:8080')
//     console.log('Para desligar o servidor: ctrl + c')
// });

// const app = express();

// app.use(cors()); // Aumentando o limite para suportar o envio das fotos em Base64 (LONGTEXT)
// app.use(bodyParser.json({ limit: '50mb' }));
// app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// // Conexão com o Banco de Dados
// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',      // Altere se o seu usuário do MySQL for diferente
//     password: '',      // Coloque a senha do seu MySQL aqui
//     database: 'bloco_notas'
// });

// db.connect(err => {
//     if (err) {
//         console.error('Erro ao conectar ao banco de dados:', err);
//         return;
//     }
//     console.log('Conectado ao banco de dados MySQL.');
// });

// // 1. ROTA DE CADASTRO
// app.post('/api/cadastro', (req, res) => {
//     const { email, senha, foto } = req.body;

//     // Verificar se usuário já existe
//     db.query('SELECT email FROM usuarios WHERE email = ?', [email], (err, results) => {
//         if (err) return res.status(500).json({ error: err.message });
//         if (results.length > 0) {
//             return res.status(400).json({ message: 'Este e-mail já está cadastrado!' });
//         }

//         // Inserir novo usuário (Nota: O campo "nome" não está no seu HTML, salvaremos o início do email temporariamente)
//         // const nometemporario = email.split('@')[0];
//         db.query('INSERT INTO usuarios (email, senha, foto) VALUES (?, ?, ?)', 
//         [email, senha, foto], (err, result) => {
//             if (err) return res.status(500).json({ error: err.message });
//             res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
//         });
//     });
// });

// // 2. ROTA DE LOGIN
// app.post('/api/login', (req, res) => {
//     const { email, senha } = req.body;

//     db.query('SELECT email, foto FROM usuarios WHERE email = ? AND senha = ?', [email, senha], (err, results) => {
//         if (err) return res.status(500).json({ error: err.message });
//         if (results.length === 0) {
//             return res.status(401).json({ message: 'E-mail ou senha incorretos!' });
//         }
//         // Retorna os dados do usuário logado
//         res.json({ message: 'Login bem-sucedido!', user: results[0] });
//     });
// });

// // 3. ROTA PARA BUSCAR DETALHES DO USUÁRIO (Foto de Perfil)
// app.get('/api/usuario/:email', (req, res) => {
//     db.query('SELECT foto FROM usuarios WHERE email = ?', [req.params.email], (err, results) => {
//         if (err) return res.status(500).json({ error: err.message });
//         if (results.length === 0) return res.status(404).json({ message: 'Usuário não encontrado' });
//         res.json(results[0]);
//     });
// });

// // 4. ROTA PARA BUSCAR ANOTAÇÕES DO USUÁRIO
// app.get('/api/anotacoes/:email', (req, res) => {
//     db.query('SELECT * FROM anotacoes WHERE usuario_email = ? ORDER BY id DESC', [req.params.email], (err, results) => {
//         if (err) return res.status(500).json({ error: err.message });
//         res.json(results);
//     });
// });

// // 5. ROTA PARA CRIAR ANOTAÇÃO
// app.post('/api/anotacoes', (req, res) => {
//     const { titulo, data_criacao, conteudo, imagem, usuario_email } = req.body;
//     db.query('INSERT INTO anotacoes (titulo, data_criacao, conteudo, imagem, usuario_email) VALUES (?, ?, ?, ?, ?)',
//     [titulo, data_criacao, conteudo, imagem, usuario_email], (err, result) => {
//         if (err) return res.status(500).json({ error: err.message });
//         res.status(201).json({ message: 'Anotação criada!', id: result.insertId });
//     });
// });

// // 6. ROTA PARA EDITAR ANOTAÇÃO
// app.put('/api/anotacoes/:id', (req, res) => {
//     const { titulo, data_criacao, conteudo } = req.body;
//     db.query('UPDATE anotacoes SET titulo = ?, data_criacao = ?, conteudo = ? WHERE id = ?',
//     [titulo, data_criacao, conteudo, req.params.id], (err, result) => {
//         if (err) return res.status(500).json({ error: err.message });
//         res.json({ message: 'Anotação atualizada com sucesso!' });
//     });
// });

// // 7. ROTA PARA DELETAR ANOTAÇÃO
// app.delete('/api/anotacoes/:id', (req, res) => {
//     db.query('DELETE FROM anotacoes WHERE id = ?', [req.params.id], (err, result) => {
//         if (err) return res.status(500).json({ error: err.message });
//         res.json({ message: 'Anotação excluída com sucesso!' });
//     });
// });

// app.listen(8080, () => {
//     console.log('Servidor rodando na porta 8080');
// });

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());

// Aumentando o limite para suportar o envio das fotos em Base64 (LONGTEXT)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Conexão com o Banco de Dados
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      // Altere se o seu usuário do MySQL for diferente
    password: '',      // Coloque a senha do seu MySQL aqui
    database: 'bloco_notas'
});

db.connect(err => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        return;
    }
    console.log('Conectado ao banco de dados MySQL.');
});

// 1. ROTA DE CADASTRO
app.post('/api/cadastro', (req, res) => {
    const { email, senha, foto } = req.body;

    // Verificar se usuário já existe
    db.query('SELECT email FROM usuarios WHERE email = ?', [email], (err, results) => {
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

    db.query('SELECT email, foto FROM usuarios WHERE email = ? AND senha = ?', [email, senha], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) {
            return res.status(401).json({ message: 'E-mail ou senha incorretos!' });
        }
        res.json({ message: 'Login bem-sucedido!', user: results[0] });
    });
});

// 3. ROTA PARA BUSCAR DETALHES DO USUÁRIO (Foto de Perfil)
app.get('/api/usuario/:email', (req, res) => {
    db.query('SELECT foto FROM usuarios WHERE email = ?', [req.params.email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'Usuário não encontrado' });
        res.json(results[0]);
    });
});

// 4. ROTA PARA BUSCAR ANOTAÇÕES DO USUÁRIO
app.get('/api/anotacoes/:email', (req, res) => {
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
    });
});

// 6. ROTA PARA EDITAR ANOTAÇÃO
app.put('/api/anotacoes/:id', (req, res) => {
    const { titulo, data_criacao, conteudo } = req.body;
    db.query('UPDATE anotacoes SET titulo = ?, data_criacao = ?, conteudo = ? WHERE id = ?',
    [titulo, data_criacao, conteudo, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Anotação atualizada com sucesso!' });
    });
});

// 7. ROTA PARA DELETAR ANOTAÇÃO
app.delete('/api/anotacoes/:id', (req, res) => {
    db.query('DELETE FROM anotacoes WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Anotação excluída com sucesso!' });
    });
});

// Apenas um servidor rodando aqui:
app.listen(8080, () => {
    console.log('Servidor rodando perfeitamente em http://localhost:8080');
    console.log('Para desligar o servidor: ctrl + c');
});