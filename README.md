> [!WARNING]
> This template is currently under development and is still being tested. Its not guaranteed that it will work at the moment!

# Discord Bot Template

A robust TypeScript template for creating Discord bots with included boilerplate code and a modular architecture.

## Features

- **Modular Architecture**: Easily extend functionality with modules
- **Command System**: Simple slash command implementation
- **Event Handling**: Automatic event registration
- **Database Integration**: MongoDB support with caching layer
- **Voice Channel Features**: Dynamic voice channel creation
- **Logging System**: Comprehensive logging for messages and events
- **Docker Support**: Run your bot in containers with Docker

## Getting Started

### Prerequisites

- Node.js v16+ with any Package Manager (npm standart)
- MongoDB instance
- Discord Bot Token

### Installation

1. Clone this repository

   ```bash
   git clone https://github.com/S42yt/discord-template.git
   cd discord-template
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Configure your environment
   ```bash
   cp .env.template .env
   # Edit .env with your bot token and other settings
   ```

### Running the Bot

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm run build
npm run prod
```

Format:

```bash
npm run pretty
```

Linting:

```bash
npm run lint
```

Docker:

```bash
docker-compose up
```

## Project Structure

```
discord-template-1/
├── src/
│   ├── commands/        # Bot commands
│   ├── core/            # Core functionality
│   │   ├── cache/       # Caching system
│   │   ├── command/     # Command interfaces
│   │   ├── database/    # Database integration
│   │   ├── event/       # Event handling
│   │   └── handlers/    # System handlers
│   ├── events/          # Event listeners
│   ├── modules/         # Modular features
│   │   └── Voice/       # Voice channel module
│   ├── util/            # Utility functions
│   ├── bot.ts           # Bot configuration
│   └── index.ts         # Entry point
├── .env.template        # Environment template
└── docker-compose.yml   # Docker configuration
```

## Creating New Modules

Add new modules by creating a folder in the `src/modules` directory with the following structure:

```
YourModule/
├── commands/    # Module-specific commands
├── events/      # Module-specific events
├── index.ts     # Module entry point
└── ...          # Other module files
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
