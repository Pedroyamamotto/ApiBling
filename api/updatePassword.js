// Script para atualizar a senha de um usuário no MongoDB via Node.js
// Uso: node updatePassword.js <email> <novaSenha>

import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';

// Configurações do banco
const uri = 'mongodb+srv://yama:yamamotoo2026@cluster0.zdmdddy.mongodb.net/?appName=Cluster0';
const dbName = 'DBservisos';
const collection = 'usuários'; // Corrigido para o nome da coleção

async function updatePassword(email, novaSenha) {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection(collection);
    const hash = await bcrypt.hash(novaSenha, 10);
    const result = await users.updateOne(
      { email: email }, // Campo correto: 'email'
      { $set: { Senha: hash } }
    );
    if (result.modifiedCount === 1) {
      console.log('Senha atualizada com sucesso!');
    } else {
      console.log('Usuário não encontrado ou senha já era essa.');
    }
  } catch (err) {
    console.error('Erro ao atualizar senha:', err);
  } finally {
    await client.close();
  }
}

// Uso: node updatePassword.js admin@yama.ia.br adm@2026
const [,, email, novaSenha] = process.argv;
if (!email || !novaSenha) {
  console.log('Uso: node updatePassword.js <email> <novaSenha>');
  process.exit(1);
}
updatePassword(email, novaSenha);
