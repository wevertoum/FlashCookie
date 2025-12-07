# Guia: Como Ajustar o Splash Screen pelo Android Studio

## Estrutura Atual do Projeto

O projeto já possui um splash screen configurado com:
- **Arquivo de drawable**: `android/app/src/main/res/drawable/splash.xml`
- **Imagem do splash**: `android/app/src/main/res/drawable/splash_image.png`
- **Tema do splash**: `SplashTheme` em `android/app/src/main/res/values/styles.xml`
- **Configuração no AndroidManifest**: A MainActivity usa o `SplashTheme`

## Passo a Passo no Android Studio

### 1. Abrir o Projeto Android no Android Studio

1. Abra o Android Studio
2. File → Open
3. Navegue até: `FlashCookie/android`
4. Selecione a pasta `android` e clique em "OK"
5. Aguarde o Gradle sincronizar

### 2. Alterar a Imagem do Splash Screen

#### Opção A: Substituir a imagem existente
1. No **Project** view (painel esquerdo), navegue até:
   ```
   app → src → main → res → drawable
   ```
2. Clique com botão direito em `splash_image.png`
3. Selecione **Replace** ou **Delete** e adicione uma nova
4. Adicione sua nova imagem (recomendado: PNG, 1080x1920px ou proporção similar)

#### Opção B: Adicionar nova imagem
1. Clique com botão direito na pasta `drawable`
2. Selecione **New → Image Asset** ou **New → Vector Asset**
3. Configure sua imagem
4. Se usar nome diferente, atualize o `splash.xml`

### 3. Ajustar o Layout do Splash (splash.xml)

1. Navegue até: `app → src → main → res → drawable → splash.xml`
2. Clique duas vezes para abrir
3. Você verá algo como:
   ```xml
   <layer-list>
       <item android:drawable="@android:color/white"/>
       <item>
           <bitmap
               android:gravity="center"
               android:src="@drawable/splash_image"/>
       </item>
   </layer-list>
   ```

#### Personalizações comuns:

**Mudar cor de fundo:**
```xml
<item android:drawable="@android:color/black"/> <!-- ou outra cor -->
```

**Usar cor customizada:**
1. Crie um arquivo em `res/values/colors.xml`:
   ```xml
   <color name="splash_background">#FF5733</color>
   ```
2. Use no splash.xml:
   ```xml
   <item android:drawable="@color/splash_background"/>
   ```

**Ajustar posição da imagem:**
```xml
android:gravity="center"        <!-- centro -->
android:gravity="center|top"    <!-- centro superior -->
android:gravity="center|bottom" <!-- centro inferior -->
android:gravity="fill"          <!-- preencher toda tela -->
```

**Adicionar padding:**
```xml
<item
    android:drawable="@drawable/splash_image"
    android:top="50dp"
    android:bottom="50dp"
    android:left="50dp"
    android:right="50dp"/>
```

### 4. Ajustar o Tema do Splash (styles.xml)

1. Navegue até: `app → src → main → res → values → styles.xml`
2. Localize o `SplashTheme`
3. Personalize conforme necessário:

```xml
<style name="SplashTheme" parent="Theme.AppCompat.Light.NoActionBar">
    <item name="android:windowBackground">@drawable/splash</item>
    <item name="android:windowNoTitle">true</item>
    <item name="android:windowActionBar">false</item>
    <item name="android:windowFullscreen">true</item> <!-- tela cheia -->
    <item name="android:windowContentOverlay">@null</item>
    <item name="android:statusBarColor">@android:color/transparent</item> <!-- barra de status transparente -->
</style>
```

### 5. Ajustar Cores e Recursos

#### Criar/Editar colors.xml:
1. Navegue até: `app → src → main → res → values`
2. Se não existir, crie `colors.xml`
3. Adicione cores customizadas:
   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <resources>
       <color name="splash_background">#FFFFFF</color>
       <color name="splash_accent">#FF5733</color>
   </resources>
   ```

### 6. Preview Visual

1. Abra qualquer arquivo XML de layout ou drawable
2. Clique na aba **Design** (abaixo do editor)
3. Ou use **Split** para ver código e preview lado a lado
4. Selecione diferentes dispositivos no dropdown de preview

### 7. Testar as Alterações

1. **Build → Rebuild Project** (ou `Cmd+Shift+F9`)
2. Execute o app: **Run → Run 'app'** (ou `Shift+F10`)
3. Ou use o terminal: `pnpm android`

## Dicas Importantes

### Tamanhos de Imagem Recomendados
- **mdpi**: 48x48dp
- **hdpi**: 72x72dp
- **xhdpi**: 96x96dp
- **xxhdpi**: 144x144dp
- **xxxhdpi**: 192x192dp

Para splash screen, use imagens maiores (ex: 1080x1920px) e coloque em `drawable` ou crie pastas específicas:
- `drawable-mdpi`
- `drawable-hdpi`
- `drawable-xhdpi`
- `drawable-xxhdpi`
- `drawable-xxxhdpi`

### Boas Práticas
- Use imagens PNG com transparência quando necessário
- Otimize imagens para reduzir tamanho do APK
- Teste em diferentes tamanhos de tela
- Considere usar Vector Drawable para ícones simples

### Troubleshooting

**Splash não aparece:**
- Verifique se `MainActivity` está usando `SplashTheme` no AndroidManifest
- Confirme que a imagem existe no caminho correto
- Rebuild o projeto

**Imagem distorcida:**
- Ajuste o `gravity` no `splash.xml`
- Use `android:scaleType` se necessário
- Considere criar versões para diferentes densidades

**Cores não aparecem:**
- Verifique se `colors.xml` está em `res/values/`
- Confirme que está referenciando corretamente: `@color/nome_da_cor`

## Estrutura de Arquivos

```
android/app/src/main/res/
├── drawable/
│   ├── splash.xml          # Layout do splash
│   └── splash_image.png    # Imagem do splash
├── values/
│   ├── styles.xml          # Tema do splash (SplashTheme)
│   └── colors.xml          # Cores customizadas (opcional)
└── ...
```

## Referências

- [Android Splash Screen Guide](https://developer.android.com/develop/ui/views/launch/splash-screen)
- [Drawable Resources](https://developer.android.com/guide/topics/resources/drawable-resource)
- [Styles and Themes](https://developer.android.com/guide/topics/ui/look-and-feel/themes)

