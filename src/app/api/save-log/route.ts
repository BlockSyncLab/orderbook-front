import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  const { question, answer } = await req.json();

  // Formatação do log
  const logEntry = {
    question,
    answer,
    timestamp: new Date().toISOString(),
  };

  try {
    // Caminho do arquivo de log
    const logFilePath = path.join(process.cwd(), 'logs', 'chat-log.json');
    const logData = fs.existsSync(logFilePath) ? fs.readFileSync(logFilePath, 'utf-8') : '[]';
    const logs = JSON.parse(logData);

    // Adiciona o novo log
    logs.push(logEntry);

    // Salva no arquivo de log
    fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));

    return new Response(JSON.stringify({ message: 'Log registrado com sucesso!' }), { status: 200 });
  } catch (error) {
    console.error('Erro ao salvar o log:', error);
    return new Response(JSON.stringify({ message: 'Erro ao salvar o log.' }), { status: 500 });
  }
}
