# Project Racer

Corrida infinita estilo *Traffic Racer* — troca de faixas, trânsito para desviar, dificuldade progressiva. Visual low poly, física arcade (sem simulação de física real), rodando no navegador e empacotável para Android via Capacitor.

> **Status atual:** esqueleto de gameplay jogável, com geometria placeholder (caixas coloridas) no lugar dos modelos 3D finais. Ver [Estado atual e roadmap](#estado-atual-e-roadmap).

## Stack

- **[Three.js](https://threejs.org/)** — motor de renderização (WebGL).
- **[Vite](https://vitejs.dev/)** — bundler/dev server.
- **TypeScript** — usado desde o início porque a arquitetura é orientada a dados (configs de veículo/mapa tipados pegam erro de config antes de rodar).
- **Física arcade "feita à mão"** — sem Rapier/Cannon. Movimentação lateral é livre e contínua (aceleração/desaceleração até uma velocidade lateral máxima, sem snap para faixa nenhuma); aceleração/frenagem longitudinal são curvas simples, não simulação de suspensão/torque.
- **[Capacitor](https://capacitorjs.com/)** — empacotamento do build web como app Android. *Ainda não configurado* — entra na reta final, depois que o gameplay e a arte estiverem validados.
- **Modelos 3D**: feitos em Blender, exportados em glTF/glb, carregados via `GLTFLoader`.

## Rodando o projeto

Pré-requisitos: [Node.js](https://nodejs.org/) 18+ e `npm`.

```bash
npm install
npm run dev
```

Abre em **http://localhost:5173**. Hot-reload: qualquer arquivo salvo em `src/` atualiza o jogo na hora.

Outros comandos:

```bash
npm run build     # typecheck (tsc) + build de produção em dist/
npm run preview   # serve o build de produção localmente, pra testar antes de publicar
```

### Controles

| Ação | Teclado | Touch (mobile) |
|---|---|---|
| Virar (livre, sem faixa) | segurar `←`/`→` ou `A`/`D` | arrastar o dedo pela tela, ou botões na HUD |
| Frear | `↓`/`S`/espaço | botão "FREIO" na HUD |

A posição lateral é livre e contínua — o carro pode ficar em qualquer ponto da largura da pista, inclusive entre faixas ou encostado numa borda. As faixas são só referência visual (`MapConfig.lanes`), não posições obrigatórias: o carro acelera/desacelera lateralmente conforme o comando, sem "encaixar" em faixa nenhuma.

O carro acelera sozinho até um teto de velocidade que sobe com o tempo (curva de dificuldade) — frear é o que você usa pra desviar do trânsito. Tilt (inclinar o celular) já está implementado em `core/input/TiltSource.ts` mas desligado por padrão; é só chamar `requestPermissionAndEnable()` de uma tela de configurações futura.

## Estrutura do projeto

A ideia central: **dados separados de lógica, lógica separada de apresentação visual**. Isso é o que permite adicionar veículo/mapa novo sem tocar em código de gameplay, e ajustar a "sensação" do jogo sem mexer em física/colisão.

```
src/
  config/              # DADOS PUROS — zero lógica aqui
    vehicles/          # um arquivo por veículo + registry (index.ts)
    maps/              # um arquivo por mapa/pista + registry (index.ts)
    constants.ts       # todo número de "tuning" do jogo, agrupado por sistema

  core/                # motor e orquestração
    Game.ts            # state machine (menu <-> gameplay) e o loop principal
    GameState.ts        # enum dos estados (MAIN_MENU, PLAYING, GAME_OVER, ...)
    SceneManager.ts     # renderer/scene/câmera/luzes do Three.js
    AssetLoader.ts       # carrega .glb via GLTFLoader, com cache
    EventBus.ts          # pub/sub — ÚNICO canal entre UI e gameplay
    input/                # teclado, touch (arrastar) e tilt, unificados num InputManager

  gameplay/            # LÓGICA PURA — sem THREE.Object3D, só números e regras
    PlayerVehicle.ts     # estado do jogador: posição lateral livre, velocidade
    Track.ts              # geração/scroll procedural dos segmentos de pista
    NpcDriver.ts            # IA de um veículo de trânsito: car-following (IDM) + troca de faixa
    TrafficSpawner.ts        # spawn de trânsito, orquestra os NpcDriver com vizinhança compartilhada
    ScenerySpawner.ts         # spawn de props decorativos nas bordas da pista
    CollisionSystem.ts       # colisão por sobreposição real de X e Z (AABB)
    ScoreSystem.ts            # pontuação e recorde (localStorage)
    DifficultyManager.ts       # curva de dificuldade (velocidade-alvo, spawn de trânsito)
    RunSession.ts               # amarra tudo isso pra uma partida

  render/               # APRESENTAÇÃO — só isso pode depender de gameplay/types.ts
    VehicleView.ts        # a camada de "juice": roll/pitch/bounce procedural
    CameraRig.ts            # câmera de perseguição com suavização
    MaterialFactory.ts       # ponto único de decisão do shading (flat vs. textura)
    PlaceholderFactory.ts     # caixas/cones coloridos no lugar dos modelos finais

  ui/                   # menus — só conversam com gameplay via EventBus
    UIManager.ts          # mapeia GameState -> qual tela mostrar
    screens/                # MainMenu, VehicleSelect, MapSelect, HUD, GameOver

  utils/
    MathUtils.ts          # clamp, lerp, expSmooth (suavização independente de framerate)
```

### Por que essa separação importa

- **`config/` nunca importa de `gameplay/` ou `render/`.** É só dado. Adicionar um veículo = criar um arquivo `VehicleConfig` + registrar no `index.ts` — nenhuma outra linha de código muda.
- **`gameplay/` nunca importa `three`** (exceto tipos, onde inevitável) nem sabe de UI. `PlayerVehicle.getState()` devolve um snapshot (`PlayerState`) puro — números, sem referência a mesh nenhuma.
- **`render/VehicleView.ts` só lê esse snapshot.** Ela nunca escreve de volta no estado de jogo. Isso é o que garante que ajustar o "balanço" visual do carro (roll, pitch, bounce) nunca pode, por acidente, mudar a hitbox de colisão ou a pontuação — são coisas fisicamente desacopladas no código, não só "por enquanto".
- **`ui/` e `gameplay/` só se falam pelo `EventBus`** (`ui:*` para intenções da UI, `game:*` para notificações do jogo). O `Game.ts` é a única classe que conhece os dois lados.

## Adicionando conteúdo novo

### Um veículo novo

Cria `src/config/vehicles/meuCarro.ts`:

```ts
import type { VehicleConfig } from './types';

export const meuCarro: VehicleConfig = {
  id: 'meu_carro',
  name: 'Meu Carro',
  // modelPath: 'models/vehicles/meu_carro.glb', // deixa comentado até exportar do Blender
  dimensions: { width: 1.9, height: 1.3, length: 4.3 },
  placeholderColor: 0x2a9d8f,
  physics: {
    maxSpeed: 48,             // m/s
    acceleration: 13,         // m/s^2
    deceleration: 20,         // m/s^2
    lateralMaxSpeed: 8,       // m/s, velocidade lateral máxima
    lateralAcceleration: 28,  // m/s^2
    lateralDeceleration: 32,  // m/s^2
  },
};
```

E registra em `src/config/vehicles/index.ts` (importar + adicionar no array `VEHICLES`). Ele aparece automaticamente na tela de seleção de veículo.

### Um mapa novo

Mesma lógica em `src/config/maps/`: cria um arquivo satisfazendo `MapConfig` (cores do tema, densidade de trânsito/cenário, multiplicador de dificuldade) e registra em `src/config/maps/index.ts`. Toda pista tem exatamente 4 faixas (`lanes.count: 4`) — isso é validado em tempo de carregamento.

### Modos de tráfego (mão única vs. mão dupla)

Um único array por mapa — `traffic.laneDirections` (4 entradas, uma por faixa: `1` = mesmo sentido do jogador, `-1` = contramão) — define o modo de tráfego inteiro. Não existe um "modo 1" e "modo 2" no código: é a mesma lógica de IA/colisão/renderização em ambos os casos, só reagindo a esse array.

```ts
laneDirections: [1, 1, 1, 1]     // highwayDusk — 4 faixas, mesmo sentido
laneDirections: [1, 1, -1, -1]   // desertNoon — mão dupla, faixas 2-3 na contramão
```

O que isso muda sozinho, sem nenhum branch de "modo" em lugar nenhum:

- `Track.ts` desenha uma linha dupla sólida (`theme.centerDividerColor`) exatamente onde o sentido muda, e faixa pontilhada normal em todo o resto.
- `NpcDriver` só considera veículos do próprio sentido pra seguir (IDM) ou pra checar segurança de troca de faixa, e só escolhe faixa-alvo dentro do intervalo contíguo de faixas do seu próprio sentido (`allowedLaneMin`/`allowedLaneMax`, calculado por `gameplay/LaneDirections.ts` a partir do array) — nunca atravessa pra contramão.
- `TrafficSpawner` inverte o sinal da contribuição de um NPC pro scroll compartilhado quando ele é contramão (`playerSpeed + speed` em vez de `playerSpeed - speed`), o que já faz a aproximação de frente ler como rápida e perigosa — a colisão em si não precisa de nenhuma lógica especial, é o mesmo `CollisionSystem` de sempre.
- O jogador continua podendo dirigir pra qualquer uma das 4 faixas, incluindo a contramão — isso é proposital (é o risco/habilidade de dirigir em mão dupla), só os NPCs são presos ao próprio sentido.

Outros knobs por mapa em `traffic`: `laneChangeChance` (chance de um NPC tentar trocar de faixa quando o timer aleatório dele dispara) e `safeFollowSeconds` (distância de segurança, em segundos de viagem, que um NPC tenta manter do carro à frente). O resto do modelo de car-following (IDM: aceleração máxima, frenagem confortável, gap mínimo) é global em `NPC_TUNING.idm`, já que são parâmetros do "modelo físico", não algo que varie por mapa.

### Ajustando a "sensação" do jogo

Tudo que é "número de tuning" — ângulo máximo de roll, velocidade de lerp da câmera, curva de dificuldade, amplitude do balanço de suspensão, comportamento de IA do trânsito — está centralizado em **`src/config/constants.ts`**, agrupado por sistema (`JUICE_TUNING`, `NPC_TUNING`, `DIFFICULTY_CURVE`, `SCORE_TUNING`, `WORLD`). Mexe ali, não no meio da lógica.

## Estado atual e roadmap

O projeto está sendo construído em etapas, validando cada uma antes de investir na próxima:

1. **✅ Esqueleto jogável** (onde estamos agora) — geometria placeholder, arquitetura modular, física arcade, câmera, "juice" visual, menus. Objetivo: validar a sensação de velocidade/faixa/câmera antes de modelar qualquer coisa.
2. **Decisão de shading** — flat/vértice sem textura vs. low poly com textura simples. A estrutura já deixa isso trocável num lugar só (`render/MaterialFactory.ts`), a decisão em si ainda está aberta.
3. **Pipeline Blender → glTF → Three.js** — validar com UM carro "hero" antes de modelar a frota e o cenário inteiro. O slot já existe: é só apontar `modelPath` no config do veículo pra `models/vehicles/<nome>.glb` (ver `public/models/README.md` pra checklist de export).
4. **Frota e cenário completos** — depois que o pipeline estiver validado.
5. **Empacotamento Android via Capacitor** — no final, depois do gameplay e da arte estarem redondos.

### Versionamento

O projeto usa [SemVer](https://semver.org/lang/pt-BR/) (`MAJOR.MINOR.PATCH`), começando em `0.1.0`. A versão `1.0.0` fica reservada para quando o jogo for declarado pronto — não é atrelada a nenhum marco técnico específico.

## Placeholders vs. modelos finais

Tudo que hoje é caixa/cone colorido (`render/PlaceholderFactory.ts`) é um substituto temporário. Quando um `VehicleConfig` ou asset de cenário ganhar um `modelPath` apontando pra um `.glb` em `public/models/`, o `AssetLoader` carrega o modelo real e a `VehicleView` troca o placeholder automaticamente assim que o carregamento terminar — nenhum outro código precisa mudar.
