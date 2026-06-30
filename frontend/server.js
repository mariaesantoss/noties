const API_URL = 'http://localhost:5500/api'; //Toda vez que o frontend precisar falar com o servidor, ele usará essa variável para evitar ter que digitar o endereço completo repetidamente.

// Identifica em qual página o usuário está com base nos elementos na tela
// Adiciona um "ouvinte de eventos" ao documento. O evento DOMContentLoaded avisa o JavaScript que o navegador terminou de carregar todo o HTML da página. É seguro ler ou modificar os elementos agora.

/* Se achar o ID cadastro, ativa a tela de cadastro.
Se achar o ID login, ativa a tela de login.
Se achar o ID navbar, entende que está logado no painel principal e inicia o Dashboard.
Se a tag <body> tiver a classe notepage-body ou a URL do navegador contiver notepage.html, ele abre a página de leitura detalhada da nota. */

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('cadastro')) inicializarCadastro();
    if (document.getElementById('login')) inicializarLogin();
    if (document.getElementById('navbar')) inicializarDashboard();
    if (document.body.classList.contains('notepage-body') || window.location.pathname.includes('notepage.html')) inicializarNotePage();
});

// Auxiliar: Transforma arquivos de imagem em String Base64 para salvar no Banco de Dados
//Define uma função que recebe um arquivo binário (a foto selecionada no seu computador) e retorna uma Promise (Promessa). Como a leitura de arquivos demora um pouco, a Promise garante que o JavaScript esperará o processo terminar para continuar.
//Instancia o leitor de arquivos do navegador (FileReader) e ordena que ele converta o arquivo para uma URL codificada em texto (uma string Base64 que começa com data:image/...).

/*Definição dos gatilhos de sucesso e erro do leitor:

.onload: Se ler com sucesso, resolve a promessa entregando o texto da imagem pronta (reader.result).

.onerror: Se algo falhar (arquivo corrompido, etc.), rejeita a promessa enviando o erro.*/

function converterParaBase64(file) {
    return new Promise((resolve, reject) => { 
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// ==================== FUNCIONALIDADE: CADASTRO ====================
//Localiza o formulário de cadastro e intercepta o envio dele (submit). O comando e.preventDefault() é crucial: ele impede que a página recarregue (comportamento padrão do HTML), permitindo que o JavaScript controle o envio via AJAX. A palavra async avisa que usaremos códigos que demandam espera (await)

function inicializarCadastro() {
    const form = document.getElementById('form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        //Captura os textos digitados nos campos email, senha, confirmarsenha e seleciona o input do tipo arquivo de foto.
        const email = form.email.value;
        const senha = form.senha.value;
        const confirmarSenha = form.confirmarsenha.value;
        const inputFile = document.getElementById('arquivo');

        if (senha !== confirmarSenha) {
            alert('As senhas não coincidem!');
            return;
        }
        //Verifica se o usuário escolheu uma foto. Se escolheu (length > 0), chama a nossa função conversora e usa o await para pausar o código ali até que a imagem vire texto puro.
        let fotoBase64 = '';
        if (inputFile.files.length > 0) {
            fotoBase64 = await converterParaBase64(inputFile.files[0]);
        }
        //O bloco try tenta executar a comunicação externa. O fetch faz um disparo POST para o seu servidor contendo um objeto JSON transformado em texto (JSON.stringify) com os dados coletados.
        try {
            const response = await fetch(`${API_URL}/cadastro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha, foto: fotoBase64 })
            });
            //Aguarda a resposta em texto do servidor e a decodifica de volta em um objeto JavaScript manipulável.
            const dados = await response.json();
            //Verifica se o servidor respondeu com status de sucesso (família dos 200). Se deu certo, salva o email no LocalStorage (memória permanente do navegador) sob a chave 'usuarioLogado' e redireciona o usuário para o painel. Caso contrário, mostra o erro enviado pelo backend.
            if (response.ok) {
                localStorage.setItem('usuarioLogado', email);
                window.location.href = 'dashboard.html';
            } else {
                alert(dados.message || 'Erro no cadastro.');
            }
        //Se o servidor estiver desligado ou a rede cair, o fetch falhará e o código pulará direto para este bloco catch, capturando o erro e alertando o usuário.
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
            //No login bem-sucedido, ele salva o e-mail devolvido diretamente pelo banco de dados na resposta do servidor (dados.user.email), garantindo que o navegador lembre de quem acabou de entrar.
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
//Protege a página de intrusos. Ela tenta ler quem é o usuário logado no LocalStorage. Se o valor retornar vazio (ou seja, não fez login), ela expulsa o invasor de volta para a página login.html.
async function inicializarDashboard() {
    const emailUsuario = localStorage.getItem('usuarioLogado');
    if (!emailUsuario) {
        window.location.href = 'login.html';
        return;
    }

    // Carregar Foto de Perfil Sincronizada
    //Faz uma requisição GET para buscar as informações do usuário atual pelo e-mail. Se o banco de dados retornar uma string de foto Base64 válida, ela injeta essa string diretamente no atributo .src da imagem do seu cabeçalho, exibindo sua foto de perfil na tela.
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
            //Busca no backend a lista de todas as anotações feitas por este e-mail. Em seguida, pega a div com id painel e zera o conteúdo de texto estático dentro dela para receber as notas dinâmicas.
            const response = await fetch(`${API_URL}/anotacoes/${emailUsuario}`);
            const anotacoes = await response.json();
            const painel = document.getElementById('painel');
            painel.innerHTML = ''; // Limpa o painel estático

            //Inicia um loop (forEach) que passa por cada anotação recebida do banco. Se a nota não tiver imagem cadastrada, ela define um link de paisagem como padrão. Cria uma nova div vazia na memória do navegador e adiciona as classes CSS necessárias.
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
                //Se o usuário clicar no texto do bloco da nota, o objeto completo da nota é transformado em texto e guardado temporariamente no LocalStorage com o nome 'notaSelecionada', abrindo logo em seguida a página de leitura expandida.
                card.querySelector('.link-nota').addEventListener('click', () => {
                    localStorage.setItem('notaSelecionada', JSON.stringify(nota));
                    window.location.href = 'notepage.html';
                });

                // Evento de Editar Nota
                //Escuta cliques no botão de editar. O e.stopPropagation() impede o "efeito cascata": ele avisa o navegador para rodar apenas a ação de editar, e não disparar por acidente o clique da classe pai (.link-nota), o que abriria a página de leitura ao invés de editar.
                card.querySelector('.editar').addEventListener('click', (e) => {
                    e.stopPropagation();
                    abrirModalEditar(nota);
                });

                // Evento de Apagar Nota
                //Ao clicar em apagar, abre uma caixinha nativa de confirmação no navegador. Se o usuário clicar em "OK", dispara um comando HTTP do tipo DELETE passando o ID específico daquela nota na URL. Uma vez deletado no banco, re-executa a função carregarAnotacoes() para limpar o item excluído da tela na hora.
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
    //O parâmetro html injeta campos de input dentro do modal e o preConfirm encapsula o que foi digitado ali em um objeto de retorno do JS.
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
            //Avalia a resposta do modal. Se a pessoa clicou em "Confirmar", extrai os valores. Se algum dos campos cruciais estiver vazio, para o envio e avisa o erro.
            if (result.isConfirmed) {
                const { titulo, data_criacao, conteudo } = result.value;
                if(!titulo || !data_criacao || !conteudo) {
                    Swal.fire('Erro', 'Preencha todos os campos!', 'error');
                    return;
                }
                //Envia um POST para salvar a nova anotação vinculando-a ao e-mail do usuário ativo no momento. Após gravado com sucesso, recarrega a lista de notas atualizando o grid.
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
    //(A função abrirModalEditar(nota) executa rigorosamente a mesma lógica do SweetAlert2 acima, apenas pré-carregando os textos antigos da nota nos campos através da propriedade value e disparando um método PUT ao invés de POST).
    function abrirModalEditar(nota) {
        // Formatar data para o input HTML (AAAA-MM-DD)
        /*new Date(nota.data_criacao): Transforma o texto do banco em um objeto de data real do JavaScript.
        .toISOString(): Transforma essa data em uma string padronizada internacionalmente, que fica mais ou menos assim: "2026-06-29T20:15:30.000Z".
        .split('T'): Corta a string no meio, usando a letra T como tesoura. Isso gera uma lista com duas partes: ["2026-06-29", "20:15:30.000Z"].
        [0]: Pega apenas o primeiro pedaço da lista (o índice 0), que é exatamente "2026-06-29"*/

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