const URL_API = 'http://localhost:3000';

// Identificadores globais de controle temporário
let fotoUsuarioBase64 = "";
let imagemNotaBase64 = "";

// Executa a lógica correta baseando-se no arquivo HTML que está aberto no momento
document.addEventListener("DOMContentLoaded", () => {
    const caminhoCompleto = window.location.pathname;
    
    if (caminhoCompleto.includes("cadastro.html")) {
        inicializarCadastro();
    } else if (caminhoCompleto.includes("login.html") || caminhoCompleto.endsWith("/")) {
        inicializarLogin();
    } else if (caminhoCompleto.includes("dashboard.html")) {
        inicializarDashboard();
    } else if (caminhoCompleto.includes("notepage.html")) {
        inicializarNotePage();
    }
});

/* ================= LÓGICA DE CADASTRO ================= */
function inicializarCadastro() {
    const inputFile = document.getElementById('arquivo');
    const form = document.getElementById('form');

    if (inputFile) {
        inputFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                document.getElementById('file-name').innerText = file.name;
                const reader = new FileReader();
                reader.onloadend = () => { fotoUsuarioBase64 = reader.result; };
                reader.readAsDataURL(file);
            }
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = e.target.email.value;
            const senha = e.target.senha.value;
            const confirmarSenha = e.target.confirmarsenha.value;

            if (senha !== confirmarSenha) {
                alert("As senhas inseridas não batem!");
                return;
            }

            try {
                const response = await fetch(`${URL_API}/usuarios`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome: 'Usuário', email, senha, foto: fotoUsuarioBase64 })
                });

                const msg = await response.text();
                if (response.ok) {
                    alert(msg);
                    localStorage.setItem('usuarioEmail', email);
                    window.location.href = 'dashboard.html';
                } else {
                    alert(msg);
                }
            } catch (error) {
                alert("Erro ao conectar ao servidor do backend.");
            }
        });
    }
}

/* ================= LÓGICA DE LOGIN ================= */
function inicializarLogin() {
    const form = document.getElementById('form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = e.target.email.value;
            const senha = e.target.senha.value;

            try {
                const response = await fetch(`${URL_API}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha })
                });

                if (response.ok) {
                    const dadosUsuario = await response.json();
                    localStorage.setItem('usuarioEmail', dadosUsuario.email);
                    localStorage.setItem('usuarioFoto', dadosUsuario.foto || '');
                    window.location.href = 'dashboard.html';
                } else {
                    const msg = await response.text();
                    alert(msg);
                }
            } catch (error) {
                alert("Erro de conexão com o servidor.");
            }
        });
    }
}

/* ================= LÓGICA DE DASHBOARD ================= */
async function inicializarDashboard() {
    const usuarioEmail = localStorage.getItem('usuarioEmail');
    const usuarioFoto = localStorage.getItem('usuarioFoto');

    if (!usuarioEmail) {
        window.location.href = 'login.html';
        return;
    }

    // Carrega a foto de perfil do cabeçalho caso o usuário tenha uma salva
    if (usuarioFoto) {
        const imgNav = document.querySelector("#voce img");
        if (imgNav) imgNav.src = usuarioFoto;
    }

    // Gerencia o arquivo de upload de imagem de dentro da nota
    const imgNotaInput = document.getElementById('notaImagemInput');
    if (imgNotaInput) {
        imgNotaInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => { imagemNotaBase64 = reader.result; };
                reader.readAsDataURL(file);
            }
        });
    }

    // Gerencia o envio do formulário de criação/edição de notas
    const formNota = document.getElementById('formNota');
    if (formNota) {
        formNota.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('notaId').value;
            const titulo = document.getElementById('notaTitulo').value;
            const conteudo = document.getElementById('notaConteudo').value;

            const payload = { titulo, conteudo, imagem: imagemNotaBase64, usuario_email: usuarioEmail };

            try {
                let response;
                if (id) {
                    // Atualização (PUT)
                    response = await fetch(`${URL_API}/anotacoes/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ titulo, conteudo, imagem: imagemNotaBase64 })
                    });
                } else {
                    // Inserção (POST)
                    response = await fetch(`${URL_API}/anotacoes`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                }

                if (response.ok) {
                    // Fecha o modal do bootstrap programaticamente
                    const modalEl = document.getElementById('modalNota');
                    const modalInstance = bootstrap.Modal.getInstance(modalEl);
                    if (modalInstance) modalInstance.hide();
                    
                    limparFormularioNota();
                    listarNotas();
                }
            } catch (error) {
                console.error("Erro ao salvar anotação", error);
            }
        });
    }

    listarNotas();
}

// Renderização Dinâmica dos Cards
async function listarNotas() {
    const email = localStorage.getItem('usuarioEmail');
    const painel = document.getElementById('painel');
    if (!painel) return;

    painel.innerHTML = '';

    try {
        const response = await fetch(`${URL_API}/anotacoes/${email}`);
        const notas = await response.json();

        if (notas.length === 0) {
            painel.innerHTML = `<span style="grid-column: 1/-1; text-align: center; font-size: 1.2rem; opacity: 0.7;">
                                    Você não possui notas cadastradas. Crie sua primeira ideia!
                                </span>`;
            return;
        }

        notas.forEach((nota, index) => {
            const dataFormatada = new Date(nota.data_criacao).toLocaleDateString('pt-BR');
            const card = document.createElement('div');
            card.className = `card card${(index % 3) + 1}`; // Mantém seu padrão de classes CSS dinamicamente

            card.innerHTML = `
                ${nota.imagem ? `<img src="${nota.imagem}" alt="Imagem da anotação">` : ''}
                <div class="info">
                    <a href="#" onclick="abrirNotaCompleta('${nota.titulo}', '${dataFormatada}', \`${encodeURIComponent(nota.conteudo)}\`, '${nota.imagem || ''}')">
                        <h3>${nota.titulo}</h3>
                        <span>${dataFormatada}</span>
                        <p>${nota.conteudo}</p> 
                    </a>
                    <ul>
                        <li>
                            <button class="editar" onclick="carregarDadosNoModal(${nota.id}, '${nota.titulo}', \`${encodeURIComponent(nota.conteudo)}\`, '${nota.imagem || ''}')">
                                <div><i class="bx bx-edit-alt"></i></div>
                            </button>
                        </li>
                        <li>
                            <button class="apagar" onclick="excluirNota(${nota.id})">
                                <div><i class="bx bx-x"></i></div>
                            </button>
                        </li>
                    </ul>
                </div>
            `;
            painel.appendChild(card);
        });
    } catch (error) {
        console.error("Erro ao listar dados", error);
    }
}

// Excluir Nota
async function excluirNota(id) {
    if (confirm("Tem certeza de que deseja remover esta nota permanente?")) {
        try {
            const response = await fetch(`${URL_API}/anotacoes/${id}`, { method: 'DELETE' });
            if (response.ok) listarNotas();
        } catch (error) {
            console.error("Erro ao deletar", error);
        }
    }
}

// Abre o formulário em modo Edição puxando os dados atuais
window.carregarDadosNoModal = function(id, titulo, conteudoCodificado, imagem) {
    const conteudo = decodeURIComponent(conteudoCodificado);
    document.getElementById('notaId').value = id;
    document.getElementById('notaTitulo').value = titulo;
    document.getElementById('notaConteudo').value = conteudo;
    imagemNotaBase64 = imagem;
    
    document.getElementById('modalTituloGeral').innerText = "Editar Anotação";
    
    const meuModal = new bootstrap.Modal(document.getElementById('modalNota'));
    meuModal.show();
};

window.limparFormularioNota = function() {
    document.getElementById('notaId').value = '';
    document.getElementById('formNota').reset();
    imagemNotaBase64 = "";
    document.getElementById('modalTituloGeral').innerText = "Nova Nota";
};

window.abrirNotaCompleta = function(titulo, data, conteudoCodificado, imagem) {
    localStorage.setItem('view_titulo', titulo);
    localStorage.setItem('view_data', data);
    localStorage.setItem('view_conteudo', decodeURIComponent(conteudoCodificado));
    localStorage.setItem('view_imagem', imagem);
    window.location.href = 'notepage.html';
};


/* ================= LÓGICA DE VISUALIZAÇÃO DA NOTA COMPLETA ================= */
function inicializarNotePage() {
    const titulo = localStorage.getItem('view_titulo');
    const data = localStorage.getItem('view_data');
    const conteudo = localStorage.getItem('view_conteudo');
    const imagem = localStorage.getItem('view_imagem');

    if (titulo) document.querySelector("header h1").innerText = titulo;
    if (data) document.querySelector("header h2").innerText = data;
    if (conteudo) document.querySelector("main div").innerText = conteudo;
    
    const divImagem = document.querySelector(".imagem");
    if (divImagem && imagem) {
        divImagem.style.backgroundImage = `url('${imagem}')`;
        divImagem.style.height = "300px"; // Garante visibilidade se o CSS original estiver vazio
        divImagem.style.backgroundSize = "cover";
        divImagem.style.backgroundPosition = "center";
    }
}