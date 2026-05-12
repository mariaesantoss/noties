CREATE DATABASE bloco_notas;

USE bloco_notas;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100),
    email VARCHAR(100),
    senha VARCHAR(100)
);

CREATE TABLE anotacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(100),
    conteudo TEXT
);
