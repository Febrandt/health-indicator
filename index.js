const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'senai',
    database: 'health_indicator'
});

db.connect(err => {
    if (err) throw err;
    console.log('Conectado ao banco de dados MySQL');
});

let user = {id: -1,idade: null, altura: null, peso: null, calculo_imc: null, calorias: null, calorias_objetivo: null, porcentagem_carboidratos: null, porcentagem_gorduras: null, porcentagem_proteinas: null};
let calculo_imc = null;
let calculo_calorias = null;

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('index', { user: user });
});

app.get('/perfil', (req, res) => {
    res.render('perfil', { user: user });
});

app.get('/calorias', (req, res) => {
    res.render('calorias', { calculo_calorias: calculo_calorias, user: user });
});

app.get('/imc', (req, res) => {
    res.render('imc', { calculo_imc: calculo_imc, user: user });
});

app.post('/logar', (req, res) => {
    const { nickname, password } = req.body;
    const sql = 'SELECT * FROM usuarios WHERE nickname = ? AND password = ?';

    db.query(sql, [nickname, password], (err, result) => {
        if (err) return;
        if (result.length === 0) {
            return res.status(400).json({ message: 'Usuário ou senha incorretos' });
        }
        user = {};
        user.id = result[0].id;
        user.nickname = nickname;
        user.password = password;
        res.redirect("/");
    });
});

app.post('/registrar', (req, res) => {
    const { nickname, password } = req.body;
    const sql = 'INSERT INTO usuarios (nickname, password) VALUES (?, ?);';

    db.query(sql, [nickname, password], (err, result) => {
        if (err) return;
        user = {};
        user.id = result.insertId;
        user.nickname = nickname;
        user.password = password;
        res.redirect("/");
    });
});

app.post('/calcular_imc', (req, res) => {
    const idade = parseInt(req.body.idade);
    const peso = parseFloat(req.body.peso);
    const altura = parseFloat(req.body.altura);
    calculo_imc = (10000 * (peso / (altura * altura)));
    console.log(idade, peso, altura);

    if (user) {
        user.idade = idade;
        user.altura = altura;
        user.peso = peso;
        user.calculo_imc = calculo_imc;
    }
    res.redirect("/imc");
});

app.post('/calcular_calorias', (req, res) => {
    const idade = parseInt(req.body.idade);
    const peso = parseFloat(req.body.peso);
    const altura = parseFloat(req.body.altura);
    const genero = req.body.genero;
    const atividade = req.body.atividade;
    calculo_calorias = (((10 * peso) + (6.25 * altura) - (5 * idade) + parseInt(genero)) * parseInt(atividade));
    console.log(calculo_calorias);

    if (user) {
        user.idade = idade;
        user.altura = altura;
        user.peso = peso;
        user.calorias = calculo_calorias;
    }
    res.redirect("/calorias");
});

app.post('/atualizar_perfil', (req, res) => {
    const { altura, idade, peso, calculo_imc, calorias, calorias_objetivo, porcentagem_carboidratos, porcentagem_proteinas, porcentagem_gorduras } = req.body;
    const sql = `
        UPDATE perfil SET
        altura = ?, idade = ?, peso = ?, imc = ?
        WHERE usuario_id = ?`;

    db.query(sql, [
        parseFloat(altura) || 0.0 , parseInt(idade) || 0, parseFloat(peso) || 0, parseFloat(calculo_imc) || 0, user.id], (err, result) => {
        if (err) throw err;
    });

	const sql2 = `
        UPDATE macros SET
		calorias = ?, calorias_objetivo = ?, porcentagem_carboidratos = ?, porcentagem_proteina = ?, porcentagem_gordura = ?
        WHERE usuario_id = ?`;
	

	db.query(sql, [
		parseInt(calorias) || 0 , parseInt(calorias_objetivo) || 0 , parseFloat(porcentagem_carboidratos) || 0, parseFloat(porcentagem_proteinas) || 0, parseFloat(porcentagem_gorduras) || 0, user.id
	], (err, result) => {
        if (err) throw err;
        res.redirect('/perfil');
    });
	user.idade = parseInt(idade);
    user.altura = parseFloat(altura);
    user.peso = parseFloat(peso);
	user.calculo_imc = parseFloat(calculo_imc);
	user.calorias = parseInt(calorias);
	user.calorias_objetivo = parseInt(calorias_objetivo);
	user.porcentagem_carboidratos = parseFloat(porcentagem_carboidratos);
	user.porcentagem_proteinas = parseFloat(porcentagem_proteinas);
	user.porcentagem_gorduras = parseFloat(porcentagem_gorduras)
});

app.get('/macros', (req, res) => {
    res.render('macros', { user: user });
});

app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
