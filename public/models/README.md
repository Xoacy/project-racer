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
- Formato de export: glTF Binary (.glb).
- Sem luzes/câmeras embutidas no export (o jogo já tem sua própria
  iluminação).
