// server.js
const express = require('express');
const { exec } = require('child_process'); // Para rodar comandos
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors());

app.post('/registrar-maquina', (req, res) => {
  console.log('Recebi pedido para registrar a máquina...');

  // --- ALTERAÇÃO AQUI ---
  // Comando para rodar um script PowerShell no Windows.
  // -ExecutionPolicy Bypass: Permite que o script rode mesmo se a política
  //                          de execução do Windows estiver restrita.
  // -File: Especifica o arquivo de script.
  const comando = 'powershell.exe -ExecutionPolicy Bypass -File "./enviarLicenca.ps1"';
  // ---------------------

  exec(comando, { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Erro ao executar: ${error.message}`);
      res.status(500).json({ success: false, message: `Erro no PowerShell: ${error.message}` });
      return;
    }
    if (stderr) {
      // O PowerShell às vezes usa stderr para mensagens normais,
      // mas é bom registrar.
      console.warn(`PowerShell Stderr: ${stderr}`);
    }

    // stdout é a saída do seu script (as linhas "Write-Host")
    console.log(`Saída do PowerShell: ${stdout}`);
    
    // Envia uma resposta de sucesso com a saída do script
    res.json({ success: true, message: stdout });
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});