CREATE DATABASE bloco_notas;
USE bloco_notas;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    senha VARCHAR(100),
    foto LONGTEXT
);

CREATE TABLE anotacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(100),
    data_criacao DATE,
    conteudo TEXT,
    imagem LONGTEXT,
    usuario_email VARCHAR(100),
    FOREIGN KEY (usuario_email) REFERENCES usuarios(email) ON DELETE CASCADE
);