const API_URL = 'http://localhost:5500/api'; //Toda vez que o frontend precisar falar com o servidor, ele usará essa variável para evitar ter que digitar o endereço completo repetidamente.

// Identifica em qual página o usuário está com base nos elementos na tela
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('cadastro')) inicializarCadastro();
    if (document.getElementById('login')) inicializarLogin();
    if (document.getElementById('navbar')) inicializarDashboard();
    if (document.body.classList.contains('notepage-body') || window.location.pathname.includes('notepage.html')) inicializarNotePage();
});

// Auxiliar: Transforma arquivos de imagem em String Base64 para salvar no Banco de Dados
function converterParaBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// ==================== FUNCIONALIDADE: CADASTRO ====================
function inicializarCadastro() {
    const form = document.getElementById('form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = form.email.value;
        const senha = form.senha.value;
        const confirmarSenha = form.confirmarsenha.value;
        const inputFile = document.getElementById('arquivo');

        if (senha !== confirmarSenha) {
            alert('As senhas não coincidem!');
            return;
        }

        let fotoBase64 = '';
        if (inputFile.files.length > 0) {
            fotoBase64 = await converterParaBase64(inputFile.files[0]);
        }

        try {
            const response = await fetch(`${API_URL}/cadastro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha, foto: fotoBase64 })
            });

            const dados = await response.json();

            if (response.ok) {
                localStorage.setItem('usuarioLogado', email);
                window.location.href = 'dashboard.html';
            } else {
                alert(dados.message || 'Erro no cadastro.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao conectar com o servidor.');
        }
    });
}

// ==================== FUNCIONALIDADE: LOGIN ====================
function inicializarLogin() {
    const form = document.getElementById('form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = form.email.value;
        const senha = form.senha.value;

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const dados = await response.json();

            if (response.ok) {
                localStorage.setItem('usuarioLogado', dados.user.email);
                window.location.href = 'dashboard.html';
            } else {
                alert(dados.message || 'Erro no login.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao conectar com o servidor.');
        }
    });
}

// ==================== FUNCIONALIDADE: DASHBOARD ====================
async function inicializarDashboard() {
    const emailUsuario = localStorage.getItem('usuarioLogado');
    if (!emailUsuario) {
        window.location.href = 'login.html';
        return;
    }

    // Carregar Foto de Perfil Sincronizada
    try {
        const resUser = await fetch(`${API_URL}/usuario/${emailUsuario}`);
        if (resUser.ok) {
            const user = await resUser.json();
            if (user.foto) {
                document.getElementById('foto-perfil-dashboard').src = user.foto;
            }
        }
    } catch (err) { console.error("Erro ao carregar foto", err); }

    // Renderizar os cards na tela vindos do banco de dados
    async function carregarAnotacoes() {
        try {
            const response = await fetch(`${API_URL}/anotacoes/${emailUsuario}`);
            const anotacoes = await response.json();
            const painel = document.getElementById('painel');
            painel.innerHTML = ''; // Limpa o painel estático

            anotacoes.forEach(nota => {
                const imgPadrao = nota.imagem || 'https://americachip.com/wp-content/uploads/2024/09/Suica-cidades.jpg';
                const card = document.createElement('div');
                card.className = 'card card1';
                card.innerHTML = `
                    <img src="${imgPadrao}">
                    <div class="info">
                        <div class="link-nota" style="cursor:pointer;">
                            <h3>${nota.titulo}</h3>
                            <span>${new Date(nota.data_criacao).toLocaleDateString('pt-BR')}</span>
                            <p>${nota.conteudo}</p>
                        </div>
                        <ul>
                            <li>
                                <button class="editar" data-id="${nota.id}">
                                    <div><i class="bx bx-edit-alt"></i></div>
                                </button>
                            </li>
                            <li>
                                <button class="apagar" data-id="${nota.id}">
                                    <div><i class="bx bx-x"></i></div>
                                </button>
                            </li>
                        </ul>
                    </div>
                `;

                // Evento para abrir a nota clicando nela (fora dos botões de ação)
                card.querySelector('.link-nota').addEventListener('click', () => {
                    localStorage.setItem('notaSelecionada', JSON.stringify(nota));
                    window.location.href = 'notepage.html';
                });

                // Evento de Editar Nota
                card.querySelector('.editar').addEventListener('click', (e) => {
                    e.stopPropagation();
                    abrirModalEditar(nota);
                });

                // Evento de Apagar Nota
                card.querySelector('.apagar').addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if(confirm("Deseja mesmo apagar esta anotação?")) {
                        await fetch(`${API_URL}/anotacoes/${nota.id}`, { method: 'DELETE' });
                        carregarAnotacoes();
                    }
                });

                painel.appendChild(card);
            });
        } catch (error) { console.error(error); }
    }

    // Ação do Botão Criar Nota (SweetAlert2)
    document.querySelector('main ul .btn').addEventListener('click', () => {
        Swal.fire({
            title: 'Nova Anotação',
            html:
                '<input id="swal-titulo" class="swal2-input" placeholder="Título">' +
                '<input id="swal-data" type="date" class="swal2-input">' +
                '<textarea id="swal-texto" class="swal2-textarea" placeholder="Sua ideia..."></textarea>',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Confirmar',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                return {
                    titulo: document.getElementById('swal-titulo').value,
                    data_criacao: document.getElementById('swal-data').value,
                    conteudo: document.getElementById('swal-texto').value
                }
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const { titulo, data_criacao, conteudo } = result.value;
                if(!titulo || !data_criacao || !conteudo) {
                    Swal.fire('Erro', 'Preencha todos os campos!', 'error');
                    return;
                }

                await fetch(`${API_URL}/anotacoes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ titulo, data_criacao, conteudo, imagem: '', usuario_email: emailUsuario })
                });

                carregarAnotacoes();
            }
        });
    });

    // Função Modal Editar (SweetAlert2)
    function abrirModalEditar(nota) {
        // Formatar data para o input HTML (AAAA-MM-DD)
        const dataFormatada = new Date(nota.data_criacao).toISOString().split('T')[0];

        Swal.fire({
            title: 'Editar Anotação',
            html:
                `<input id="swal-edit-titulo" class="swal2-input" value="${nota.titulo}">` +
                `<input id="swal-edit-data" type="date" class="swal2-input" value="${dataFormatada}">` +
                `<textarea id="swal-edit-texto" class="swal2-textarea">${nota.conteudo}</textarea>`,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Salvar',
            preConfirm: () => {
                return {
                    titulo: document.getElementById('swal-edit-titulo').value,
                    data_criacao: document.getElementById('swal-edit-data').value,
                    conteudo: document.getElementById('swal-edit-texto').value
                }
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                await fetch(`${API_URL}/anotacoes/${nota.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(result.value)
                });
                carregarAnotacoes();
            }
        });
    }

    carregarAnotacoes();
}

// ==================== FUNCIONALIDADE: NOTEPAGE ====================
function inicializarNotePage() {
    const nota = JSON.parse(localStorage.getItem('notaSelecionada'));
    if (!nota) {
        window.location.href = 'dashboard.html';
        return;
    }

    document.querySelector('header h1').textContent = nota.titulo;
    document.querySelector('header h2').textContent = new Date(nota.data_criacao).toLocaleDateString('pt-BR');
    document.querySelector('main div').textContent = nota.conteudo;
    
    if (nota.imagem) {
        document.querySelector('.imagem').style.backgroundImage = `url(${nota.imagem})`;
    }
}