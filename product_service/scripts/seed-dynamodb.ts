import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from 'uuid';
import { execSync } from 'child_process';

// Automatyczne wykrycie regionu z konfiguracji lokalnej AWS CLI
let region = 'eu-west-1';
try {
    region = execSync('aws configure get region').toString().trim();
} catch (e) {
    console.warn("Nie udało się pobrać regionu z AWS CLI, używam domyślnego: eu-west-1");
}

const client = new DynamoDBClient({ region });

const mockProducts = [
    { title: 'Korg MS-20 Mini', description: 'Monophonic Analog Synthesizer', price: 599, count: 4 },
    { title: 'Moog Mother-32', description: 'Semi-Modular Eurorack Synthesizer', price: 649, count: 12 },
    { title: 'Arturia MicroFreak', description: 'Algorithmic Synthesizer', price: 349, count: 25 },
    { title: 'Roland Boutique JU-06A', description: 'Sound Module based on Juno', price: 399, count: 8 },
    { title: 'Elektron Digitakt', description: 'Drum Computer & Sampler', price: 799, count: 5 },
    { title: 'Novation Peak', description: 'Eight-voice polyphonic synthesizer', price: 1299, count: 3 }
];

async function seed() {
    console.log(`[SEED] Rozpoczynam zasilanie bazy w regionie: ${region}...`);

    for (const item of mockProducts) {
        const productId = uuidv4();

        try {
            // 1. Wstawienie do tabeli 'products'
            await client.send(new PutItemCommand({
                TableName: 'products',
                Item: {
                    id: { S: productId },
                    title: { S: item.title },
                    description: { S: item.description },
                    price: { N: item.price.toString() }
                }
            }));

            // 2. Wstawienie do tabeli 'stocks'
            await client.send(new PutItemCommand({
                TableName: 'stocks',
                Item: {
                    product_id: { S: productId },
                    count: { N: item.count.toString() }
                }
            }));

            console.log(`[OK] Dodano: ${item.title} (ID: ${productId})`);
        } catch (error: any) {
            console.error(`[ERR] Błąd przy produkcie ${item.title}:`, error.message);
        }
    }

    console.log("[FINISH] Zasilanie zakończone pomyślnie.");
}

seed().catch((err) => {
    console.error("[FATAL] Skrypt zakończył się niepowodzeniem:", err);
    process.exit(1);
});