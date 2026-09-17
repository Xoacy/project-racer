# Modelos glTF

Coloque aqui os exports do Blender (`.glb` preferencialmente, é o glTF binário — um arquivo só, mais fácil de referenciar).

Convenção de pastas:

- `models/vehicles/<vehicle_id>.glb` — ex: `models/vehicles/sedan_hero.glb`
- `models/scenery/<prop_name>.glb`

Depois de exportar, aponte o `modelPath` do veículo/prop correspondente em
`src/config/vehicles/*.ts` (ex: `sedanHero.ts`) ou `src/config/maps/*.ts`
para `models/vehicles/sedan_hero.glb`. O `AssetLoader` carrega
automaticamente e a `VehicleView` troca o placeholder pelo modelo real assim
que o carregamento terminar — nenhum outro código precisa mudar.

## Checklist de export (Blender -> glTF)

- Aplicar todas as transforms (Ctrl+A -> All Transforms) antes de exportar.
- Origem do objeto no centro da base do veículo (equivalente ao que o
  placeholder já assume: caixa apoiada em y=0).
- Escala em metros reais (ex: um sedan ~4.2m de comprimento).
- **A frente do veículo aponta para -Z** (é a direção em que o jogador
  dirige; a câmera fica atrás, em +Z). Um modelo virado para +Z aparece
  andando de ré.
- Formato de export: glTF Binary (.glb).
- Sem luzes/câmeras embutidas no export (o jogo já tem sua própria
  iluminação).

Essa convenção é **assada no arquivo**, não corrigida em código — não
existem campos de escala/rotação no `VehicleConfig` de propósito, para que
não haja dois lugares definindo a mesma coisa. Modelo de terceiro que não
siga a convenção deve ser normalizado antes de virar `.glb`.

## Arquivos-fonte

Os fontes (`.blend`, `.obj`, renders) ficam em `art-source/` na raiz do
projeto — fora do `public/` e no `.gitignore`, porque tudo em `public/` é
copiado para o build final e vai junto no APK. Só o `.glb` já convertido e
no tamanho de jogo entra aqui.

## Exemplo real: `vehicles/muscle_brute.glb`

Veio como OBJ em escala 2x e virado para +Z. Foi normalizado (escala 0.5,
giro de 180°, rodas apoiadas em y=0, centralizado) e convertido com
`npx obj2gltf`. As `dimensions` no config do veículo foram medidas do
modelo já normalizado (4.92 x 1.96 x 1.34 m), para a caixa de colisão
bater com o que aparece na tela.
