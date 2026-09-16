// server.js (Roda no terminal com o Node)
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
app.use(cors()); 
app.use(express.json()); 

async function iniciarBanco() {
    const db = await open({
        filename: '../banco.db',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT,
            senha TEXT
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS pedidos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente TEXT,
            contato TEXT,
            endereco TEXT,
            bolsa TEXT,
            quantidade INTEGER,
            material TEXT,
            medidas TEXT,
            cores TEXT,
            data_entrega TEXT,
            forma_entrega TEXT,
            valor REAL,
            observacao TEXT
        )
    `);

    const totalUsuarios = await db.get('SELECT COUNT(*) as total FROM usuarios');
    
    if (totalUsuarios.total === 0) {
        await db.run('INSERT INTO usuarios (nome, senha) VALUES (?, ?)', ['admin', 'admin']);
        console.log("--> USUÁRIO PADRÃO CRIADO: nome: admin | senha: admin");
    }

    return db;
}

const dbPromise = iniciarBanco();

app.post('/cadastrar', async (req, res) => {
    try {
        const { nome, senha } = req.body;
        if (!nome || !senha) {
            return res.status(400).json({ erro: "Nome e senha são obrigatórios." });
        }
        const db = await dbPromise;
        await db.run('INSERT INTO usuarios (nome, senha) VALUES (?, ?)', [nome, senha]);
        res.status(201).json({ mensagem: "Usuário cadastrado com sucesso!" });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: "Erro ao salvar funcionário no banco de dados." });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { nome, senha } = req.body;

        if (!nome || !senha) {
            return res.status(400).json({ erro: "Nome e senha são obrigatórios para entrar." });
        }

        const db = await dbPromise;
        const usuarioValido = await db.get('SELECT * FROM usuarios WHERE nome = ? AND senha = ?', [nome, senha]);

        if (usuarioValido) {
            res.status(200).json({ 
                sucesso: true, 
                mensagem: "Login realizado com sucesso!",
                nomeUsuario: usuarioValido.nome 
            });
        } else {
            res.status(401).json({ 
                sucesso: false, 
                erro: "Nome de usuário ou senha incorretos." 
            });
        }
    } catch (erro) {
        console.error("Erro ao realizar login:", erro);
        res.status(500).json({ erro: "Erro interno no servidor ao tentar logar." });
    }
});

app.post('/cadastrar-pedido', async (req, res) => {
    try {
        const db = await dbPromise;
        const {
            cliente, contato, endereco, bolsa, quantidade, 
            material, medidas, cores, data_entrega, forma_entrega, valor, observacao
        } = req.body;

        if (!cliente || !contato || !bolsa || !valor) {
            return res.status(400).json({ erro: "Campos obrigatórios ausentes (Cliente, Contato, Bolsa, Valor)." });
        }

        await db.run(`
            INSERT INTO pedidos (
                cliente, contato, endereco, bolsa, quantidade, 
                material, medidas, cores, data_entrega, forma_entrega, valor, observacao
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [
                cliente, contato, endereco, bolsa, quantidade, 
                material, medidas, cores, data_entrega, forma_entrega, valor, observacao
            ]
        );

        res.status(201).json({ mensagem: "Pedido salvo com sucesso!" });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: "Erro ao salvar o pedido no banco de dados." });
    }
});

app.get('/listar-pedidos', async (req, res) => {
    try {
        const db = await dbPromise;
        const pedidos = await db.all('SELECT * FROM pedidos ORDER BY id DESC');
        res.status(200).json(pedidos);
    } catch (erro) {
        console.error("Erro ao buscar pedidos:", erro);
        res.status(500).json({ erro: "Erro ao buscar os pedidos no banco de dados." });
    }
});

app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});
