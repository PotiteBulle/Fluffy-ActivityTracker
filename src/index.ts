// src/index.ts
import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Charger les variables d'environnement
dotenv.config();

// Créer une nouvelle instance de client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Fonction pour créer le dossier Users si nécessaire
function ensureUsersDirectory() {
    const usersDir = path.join(__dirname, '../Users');
    if (!fs.existsSync(usersDir)) {
        fs.mkdirSync(usersDir);
        console.log('Dossier Users créé');
    }
}

// Lorsque le client est prêt
client.once('ready', async () => {
    console.log(`Connecté en tant que ${client.user?.tag}`);

    // S'assurer que le dossier Users existe
    ensureUsersDirectory();

    // Récupérer le serveur
    const guild = client.guilds.cache.get(process.env.GUILD_ID!);
    if (!guild) {
        console.error('Serveur non trouvé');
        return;
    }

    // Analyser les membres
    const members = await guild.members.fetch();

    // Récupérer les canaux de texte du serveur
    const textChannels = guild.channels.cache.filter(channel => channel instanceof TextChannel);

    for (const member of members.values()) {
        for (const channel of textChannels.values()) { // Utilisation de .values() pour itérer sur la collection
            // Vérifier si l'utilisateurice a des messages dans le canal
            const messages = await channel.messages.fetch({ limit: 100 }); // Limite à 100 messages

            // Filtrer les messages envoyés par l'utilisateur
            const userMessages = messages.filter(msg => msg.author.id === member.id);

            userMessages.forEach((message) => {
                const messageInfo = {
                    id: message.id,
                    content: message.content,
                    timestamp: message.createdAt,
                    author: {
                        id: member.id,
                        username: member.user.username,
                    },
                };

                // Créer un fichier pour chaque message de l'utilisateur
                const fileName = `${member.user.username.replace(/[\/\\:*?"<>|]/g, '_')}_${message.id}.json`; // Remplace les caractères invalides
                const filePath = path.join('Users', fileName);

                // Écrire les données du message dans le fichier
                fs.writeFileSync(filePath, JSON.stringify(messageInfo, null, 2));
                console.log(`Fichier créé pour le message de ${member.user.username}: ${filePath}`);
            });
        }
    }

    console.log('Analyse des membres terminée.');
});

// Se connecter au serveur Discord
client.login(process.env.DISCORD_TOKEN);