// script.js (Roda no navegador)
var usuario_nome;
var usuario_senha;
var txt_nome_hora = document.getElementById("nome_hora");
var txt_msg_erro = document.getElementById("msg_erro");
var data = new Date();
var hora = data.getHours();
var minutos = data.getMinutes();
var segundos = data.getSeconds();
var count_focusTab = 0;
var count_menu = 0;
var count_tela = 0;

var inputs = document.querySelectorAll('input');

// Sistema de persistência de Login (SessionStorage)
var usuario_logado = sessionStorage.getItem("logado") === "true";

// Executa imediatamente: se já estiver logado, oculta o login direto sem travar no DOMContentLoaded
if (usuario_logado) {
    var nomeSalvo = sessionStorage.getItem("usuario_nome") || "ANTHONY";
    txt_nome_hora.innerHTML = nomeSalvo + "<br>" + (hora < 10 ? "0" + hora : hora) + ":" + (minutos < 10 ? "0" + minutos : minutos) + ":" + (segundos < 10 ? "0" + segundos : segundos);
    
    // Usa uma checagem segura para garantir que o elemento existe antes de mudar o estilo
    setTimeout(() => {
        const painelLogin = document.getElementById("rect_login");
        if (painelLogin) painelLogin.style.display = "none";
    }, 10);
}

// Ouvinte de teclado para navegação com o 'Enter' na tela de login
if (usuario_logado !== true) {
    document.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            if (count_focusTab == 0) {
                document.getElementById("usuario_senha").focus();
                count_focusTab = 1;
            } else if (count_focusTab == 1) {
                document.getElementById("btn_entrar").focus();
                count_focusTab = 2;
            } else if (count_focusTab == 2) {
                document.getElementById("usuario_nome").focus();
                count_focusTab = 0;
            }
        }
    });
}

// CORRIGIDO: Agora acessa os índices [0] e [1] corretamente para não quebrar o script inteiro
function fechar_abrir_login() {
    document.getElementById("rect_login").style.display = "none";
    console.log("LOGIN FECHADO");
    
    if (inputs.length >= 2) {
        inputs[0].value = "";
        inputs[1].value = "";
    }
}

// Atualize a função entrar() para consultar a nova API de login
async function entrar() {
    usuario_nome = document.getElementById("usuario_nome").value;
    usuario_senha = document.getElementById("usuario_senha").value;

    if (!usuario_nome || !usuario_senha) {
        txt_msg_erro.innerText = "Por favor, preencha todos os campos.";
        return;
    }

    try {
        const resposta = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nome: usuario_nome,
                senha: usuario_senha
            })
        });

        const resultado = await resposta.json();

        if (resposta.ok && resultado.sucesso) {
            txt_nome_hora.innerHTML = resultado.nomeUsuario + "<br>" + (hora < 10 ? "0" + hora : hora) + ":" + (minutos < 10 ? "0" + minutos : minutos) + ":" + (segundos < 10 ? "0" + segundos : segundos);
            
            usuario_logado = true;
            sessionStorage.setItem("logado", "true");
            sessionStorage.setItem("usuario_nome", resultado.nomeUsuario);
            
            if (typeof carregarPedidosDoBanco === "function") {
                carregarPedidosDoBanco();
            }

            return fechar_abrir_login();
        } else {
            txt_msg_erro.innerText = resultado.erro || "Credenciais incorretas.";
            usuario_logado = false;
            sessionStorage.setItem("logado", "false");
        }

    } catch (erro) {
        console.error("Erro na requisição de login:", erro);
        txt_msg_erro.innerText = "Não foi possível conectar ao servidor de autenticação.";
    }
}

function abrir_fechar_menu() {
    if (usuario_logado !== false) {
        if (count_menu == 0) {
            document.getElementById("menu").style.display = "block";
            count_menu = 1;
        } else {
            document.getElementById("menu").style.display = "none";
            count_menu = 0;
        }
    } else {
        document.getElementById("usuario_nome").focus();
        count_focusTab = 0;
    }
}

function abrir_tela_cad_ped() {
    document.getElementById("tela_cad_pedido").style.display = "block";
    count_tela = 1;    
    return abrir_fechar_menu();
}

function fechar_tela() {
    var conf_fechar = window.confirm("Ao fechar perde todas informações que não foram salvas, deseja continuar?");
    if (conf_fechar === true) {
        document.getElementById("tela_cad_pedido").style.display = "none";
        count_tela = 0;
        limpar_campos_formulario();
        console.log("TELA FECHADA");
    } else {
        document.getElementById("tela_cad_pedido").style.display = "block";
        count_tela = 1; 
    }
}

async function salvar_pedido(event) {
    if (event) event.preventDefault(); 

    const dadosPedido = {
        cliente: document.getElementById("input_nome_cliente").value,
        contato: document.getElementById("input_contato_cliente").value,
        endereco: document.getElementById("input_endereco_cliente").value,
        bolsa: document.getElementById("input_nome_bolsa").value,
        quantidade: document.getElementById("input_qntd_bolsa").value,
        material: document.getElementById("input_material_bolsa").value,
        medidas: document.getElementById("input_med_bolsa").value,
        cores: document.getElementById("input_cores_bolsa").value,
        data_entrega: document.getElementById("input_data_entrega").value,
        forma_entrega: document.getElementById("input_forma_entrega").value,
        valor: document.getElementById("input_valor").value,
        observacao: document.getElementById("input_obs").value
    };

    if (!dadosPedido.cliente || !dadosPedido.bolsa || !dadosPedido.valor || !dadosPedido.contato) {
        alert("Por favor, preencha os campos obrigatórios (Cliente, Contato, Bolsa e Valor)!");
        return;
    }

    try {
        const resposta = await fetch('http://localhost:3000/cadastrar-pedido', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosPedido)
        });

        const resultado = await resposta.json();

        if (resposta.ok) {
            carregarPedidosDoBanco();
            console.log("PEDIDO SALVO NO BANCO DE DADOS");
            window.alert(resultado.mensagem);
            limpar_campos_formulario();
            document.getElementById("input_nome_cliente").focus();
        } else {
            alert(resultado.erro);
        }

    } catch (erro) {
        console.error("Erro ao enviar pedido para o banco:", erro);
        alert("Não foi possível conectar ao servidor back-end para registrar o pedido.");
    }
}

function limpar_pedido(event) {
    if (event) event.preventDefault();

    var conf_limpar = window.confirm("Ao limpar você perde todas informações que não foram salvas, deseja continuar?");
    if (conf_limpar === true) {
        limpar_campos_formulario();
        document.getElementById("input_nome_cliente").focus();
    }
}

function limpar_campos_formulario() {
    var IDsParaLimpar = [
        "input_nome_cliente", "input_contato_cliente", "input_endereco_cliente",
        "input_nome_bolsa", "input_qntd_bolsa", "input_material_bolsa",
        "input_med_bolsa", "input_cores_bolsa", "input_data_entrega",
        "input_forma_entrega", "input_valor", "input_obs"
    ];

    IDsParaLimpar.forEach(function(id) {
        var elemento = document.getElementById(id);
        if (elemento) {
            elemento.value = "";
        }
    });
}

function cadastrarFuncionarioPrompt(event) {
    if (event) event.preventDefault(); 

    setTimeout(() => {
        let nome = prompt("Digite o nome do novo funcionário:");
        let senha = prompt("Digite a senha para o novo funcionário:");

        if (nome && senha) {
            enviarCadastroParaOBanco(nome, senha);
        } else {
            alert("Cadastro cancelado. Nome e senha são obrigatórios.");
        }
    }, 100);
}

async function enviarCadastroParaOBanco(nomeDigitado, senhaDigitada) {
    try {
        const resposta = await fetch('http://localhost:3000/cadastrar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nome: nomeDigitado,
                senha: senhaDigitada
            })
        });

        const resultado = await resposta.json();

        if (resposta.ok) {
            alert(resultado.mensagem); 
        } else {
            if (txt_msg_erro) txt_msg_erro.innerText = resultado.erro;
        }

    } catch (erro) {
        console.error("Erro ao conectar no servidor:", erro);
        alert("Não foi possível conectar ao servidor back-end.");
    }
}

async function carregarPedidosDoBanco() {
    try {
        const resposta = await fetch('http://localhost:3000/listar-pedidos');
        const pedidos = await resposta.json();

        if (resposta.ok) {
            atualizarListaNaTela(pedidos);
        } else {
            console.error("Erro do servidor:", pedidos.erro);
        }
    } catch (erro) {
        console.error("Não foi possível carregar os pedidos do banco de dados:", erro);
    }
}

function atualizarListaNaTela(pedidos) {
    const listaContainer = document.getElementById("lista_pedidos");
    listaContainer.innerHTML = ""; 

    if (pedidos.length === 0) {
        listaContainer.innerHTML = '<p style="color: #fff; padding: 10px; font-size: 12px;">Nenhum pedido registrado.</p>';
        return;
    }

    pedidos.forEach(pedido => {
        listaContainer.innerHTML += `${pedido.cliente}Bolsa: ${pedido.bolsa} (${pedido.quantidade} unds)Entrega: ${pedido.data_entrega}`;});}// Dispara a busca assim que o arquivo é totalmente lido pelo navegadorif (usuario_logado) {carregarPedidosDoBanco();}
