const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, Collection, ChannelType, PermissionsBitField } = require('discord.js');
const express = require('express');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is online!'));
app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));

// Slash command registration (can be moved to a deploy-commands.js)
client.commands = new Collection();
const commands = [
  {
    name: 'sendembed',
    description: 'Send an embed message',
    options: [{ name: 'message', type: 3, description: 'Message to send', required: true }]
  },
  {
    name: 'giveaway',
    description: 'Create a giveaway',
    options: [
      { name: 'title', type: 3, description: 'Title of giveaway', required: true },
      { name: 'duration', type: 3, description: 'Duration (e.g., 1m, 1h)', required: true }
    ]
  },
  {
    name: 'ticket',
    description: 'Create a support ticket panel',
    options: [
      { name: 'message', type: 3, description: 'Ticket panel message', required: true },
      { name: 'button', type: 3, description: 'Button label', required: true }
    ]
  },
  {
    name: 'fake',
    description: 'Send a fake message as someone else',
    options: [
      { name: 'user', type: 6, description: 'User to mimic', required: true },
      { name: 'message', type: 3, description: 'Fake message', required: true }
    ]
  },
  {
    name: 'serverinfo',
    description: 'Get server information'
  }
];

client.on('ready', () => {
  console.log(`Bot is online as ${client.user.tag}`);
  client.application.commands.set(commands);
});

// Welcome & Goodbye
client.on('guildMemberAdd', member => {
  const channel = member.guild.systemChannel;
  if (!channel) return;
  const embed = new EmbedBuilder()
    .setTitle('👋 Welcome!')
    .setDescription(`${member.user.tag} joined. We now have ${member.guild.memberCount} members.`)
    .setColor('Green')
    .setFooter({ text: 'Pixel Bot 2025' });
  channel.send({ embeds: [embed] });
});

client.on('guildMemberRemove', member => {
  const channel = member.guild.systemChannel;
  if (!channel) return;
  const embed = new EmbedBuilder()
    .setTitle('😢 Goodbye!')
    .setDescription(`${member.user.tag} left. We now have ${member.guild.memberCount} members.`)
    .setColor('Red')
    .setFooter({ text: 'Pixel Bot 2025' });
  channel.send({ embeds: [embed] });
});

// Interactions
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options, guild, channel, user } = interaction;

  if (commandName === 'sendembed') {
    const message = options.getString('message');
    const embed = new EmbedBuilder()
      .setTitle('📢 Announcement')
      .setDescription(message)
      .setColor('Blue')
      .setFooter({ text: 'Pixel Bot 2025' });
    await interaction.reply({ content: 'Embed sent!', ephemeral: true });
    await channel.send({ embeds: [embed] });

  } else if (commandName === 'giveaway') {
    const title = options.getString('title');
    const duration = options.getString('duration');
    const embed = new EmbedBuilder()
      .setTitle('🎉 Giveaway')
      .setDescription(`${title}
Click the button below to enter!`)
      .setColor('Gold')
      .setFooter({ text: 'Pixel Bot 2025' });

    const button = new ButtonBuilder()
      .setCustomId('join_giveaway')
      .setLabel('🎁 Join')
      .setStyle(ButtonStyle.Primary);

    await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(button)] });
    setTimeout(() => interaction.editReply({ content: 'Giveaway ended!', components: [] }), ms(duration));

  } else if (commandName === 'ticket') {
    const message = options.getString('message');
    const buttonLabel = options.getString('button');
    const embed = new EmbedBuilder()
      .setTitle('🎫 Support Ticket')
      .setDescription(message)
      .setColor('Purple')
      .setFooter({ text: 'Pixel Bot 2025' });

    const button = new ButtonBuilder()
      .setCustomId('create_ticket')
      .setLabel(buttonLabel)
      .setStyle(ButtonStyle.Secondary);

    await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(button)] });

  } else if (commandName === 'fake') {
    const fakeUser = options.getUser('user');
    const message = options.getString('message');
    await interaction.reply({ content: `**${fakeUser.username}:** ${message}`, ephemeral: false });

  } else if (commandName === 'serverinfo') {
    const embed = new EmbedBuilder()
      .setTitle('📊 Server Info')
      .addFields(
        { name: 'Members', value: `${guild.memberCount}`, inline: true },
        { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
        { name: 'Channels', value: `${guild.channels.cache.size}`, inline: true }
      )
      .setColor('Blue')
      .setFooter({ text: 'Pixel Bot 2025' });
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
});

// Helpers
function ms(duration) {
  const match = duration.match(/(\d+)([smhd])/);
  if (!match) return 0;
  const value = parseInt(match[1]);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * (multipliers[unit] || 0);
}

client.login(process.env.TOKEN);
