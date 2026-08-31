<div align="center">

<img width="100%" alt="UVibes - Tela 1" src="https://github.com/user-attachments/assets/03ae3274-2337-4f4e-a708-1d073775fc45" />

<br>

<img width="100%" alt="UVibes - Tela 2" src="https://github.com/user-attachments/assets/d370b114-774d-46fc-baa5-178b4e861853" />

</div>


**UVibes 🎵** 
**Descubra novas músicas, artistas e álbuns com base na matemática do seu gosto musical!**

O UVibes é uma aplicação web desenvolvida em TypeScript e React que utiliza a API do Spotify para analisar os hábitos musicais dos usuários e sugerir novos conteúdos que combinam perfeitamente com seu estilo. A plataforma conecta-se diretamente à conta de streaming do usuário para identificar a faixa atual e, com base em atributos acústicos e musicais (como BPM, tonalidade, sonoridade e energia), executa cálculos para encontrar músicas, álbuns e artistas similares.

**Objetivo do Projeto** 🎵 

* Análise de Perfil Musical: Interpretar o gosto musical do usuário a partir das faixas reproduzidas em tempo real.
* Mapeamento de Atributos: Identificar características acústicas detalhadas de cada música.
* Algoritmo de Similaridade: Calcular padrões de proximidade entre diferentes faixas para recomendações assertivas.
* Integração com Spotify: Autenticação segura e sincronização contínua com os dados da conta do usuário.
* Mecanismos de Fallback: Garantir a continuidade da experiência com dados armazenados localmente caso haja falha em requisições externas.


**A aplicação interpreta os seguintes atributos do áudio: 🎵**

- BPM (batidas por minuto);
- Key (tonalidade);
- Mode (modo musical: maior ou menor);
- Danceability (dançabilidade);
- Energy (energia);
- Valence (valência);
- Acousticness (acusticidade);
- Instrumentalness (instrumentalidade);
- Loudness (intensidade sonora);
- Time Signature (fórmula de compasso).

As músicas encontradas podem ser organizadas de acordo com sua relação com o BPM da faixa base:

- Exact — proximidade mínima;
- Similar — proximidade moderada;
- Halftime — aproximadamente metade do BPM;
- Doubletime — aproximadamente o dobro do BPM.

**Tecnologias Utilizadas:**
Para o desenvolvimento da interface e na estruturação da aplicação:
* React — construção da interface e componentes;
* TypeScript — tipagem estática e desenvolvimento da aplicação;
* Vite — ferramenta de desenvolvimento e build;
* CSS — estilização, responsividade e efeitos visuais.
Para a integração e autenticação com Spotify:
* Spotify Web API — acesso aos dados musicais;
* OAuth PKCE — autenticação da aplicação com o Spotify.
As ferramentas para o gerenciamento de variáveis e a qualidade do código:
* dotenv — gerenciamento de variáveis de ambiente;
* oxlint — análise estática e verificação do código.

Como Executar o Projeto Localmente: 
Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/Enz0EMCosta/UVibes.git](https://github.com/Enz0EMCosta/UVibes.git)
   cd UVibes

2. **Instale as dependências:**
```bash
   npm install
   ```

3. **Configure as Variáveis de Ambiente:**
Crie um arquivo .env na raiz do projeto com base no .env.example:
```env
   VITE_SPOTIFY_CLIENT_ID=seu_client_id_aqui
   VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/callback
   ```
4. **Inicie o servidor de desenvolvimento:**
```bash
   npm run dev
   ```
O UVibes nasceu da ideia de transformar uma experiência cotidiana — ouvir música — em uma forma de descobrir novos conteúdos, onde ao invés vez de simplesmente perguntar:
- "Qual música você gosta?"
o UVibes busca entender:
- "Quais características fazem você gostar dessa música?"
A partir disso, a aplicação utiliza dados musicais para encontrar novas possibilidades que podem combinar com o seu estilo.
