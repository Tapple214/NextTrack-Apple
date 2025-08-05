# NextTrack - Advanced Music Recommendation System

A sophisticated music recommendation application that implements multiple recommendation algorithms using the Spotify Web API.

## 🎵 Features

### Multiple Recommendation Systems

#### 1. **Hybrid System (Recommended)**

- **Combines** content-based and collaborative filtering
- **Weighted scoring**: 60% content similarity + 40% collaborative score
- **Most accurate** recommendations
- **Best for**: Users who want the most personalized experience

#### 2. **Content-Based Filtering**

- **Analyzes audio features** from Spotify's API:
  - **Tempo (BPM)**: Beat patterns and rhythm
  - **Energy**: Intensity and loudness levels
  - **Danceability**: How suitable for dancing
  - **Valence**: Musical positivity (happy/sad mood)
  - **Instrumentalness**: Vocals vs instrumental content
  - **Acousticness**: Acoustic vs electronic sound
- **Best for**: Users who want similar musical characteristics

#### 3. **Collaborative Filtering**

- **User behavior patterns**: "Users who liked this also liked..."
- **Artist similarity**: Tracks by the same artist
- **Popular trends**: Currently trending tracks
- **Social proof**: Based on collective preferences
- **Best for**: Users who want discovery based on others' tastes

#### 4. **Original Artist-Based System**

- **Simple approach**: Tracks by the same artist
- **Fast results**: Quick but less accurate
- **Best for**: Users who want quick, simple recommendations

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Spotify account

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd NextTrack-Apple
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🎯 How to Use

### Getting Recommendations

1. **Select a recommendation system** from the dropdown:

   - **Hybrid System**: Best overall accuracy
   - **Content-Based**: Based on audio features
   - **Collaborative**: Based on user patterns
   - **Original**: Simple artist-based

2. **Enter a Spotify track URL** in the input field

   - Format: `https://open.spotify.com/track/[track-id]`
   - Example: `https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh`

3. **Click "Get Recommendations"** to receive personalized suggestions

4. **View results** with detailed information:
   - Similarity scores
   - Recommendation reasons
   - System-specific features

### Understanding the Results

#### Hybrid System Results

- **Hybrid Score**: Combined accuracy score (0-100%)
- **Content Score**: Audio feature similarity
- **Collaborative Score**: User behavior similarity

#### Content-Based Results

- **Similarity Score**: How similar the audio features are
- **Feature Analysis**: Detailed breakdown of musical characteristics

#### Collaborative Results

- **Collaborative Score**: User behavior similarity
- **Reason**: Why this track was recommended

## 🔧 Technical Implementation

### Architecture

```
src/
├── components/
│   ├── TrackRecommendationForm.js    # Recommendation form with system selection
│   ├── RecommendationResults.js      # Results display with scores
│   ├── RecommendationInfo.js         # System information cards
│   └── ...
├── utils/
│   └── RecommenderAPI.js            # Core recommendation algorithms
└── App.js                           # Main application component
```

### Key Components

#### RecommenderAPI.js

- **Content-Based Filtering**: `getContentBasedRecommendations()`
- **Collaborative Filtering**: `getCollaborativeRecommendations()`
- **Hybrid System**: `getHybridRecommendations()`
- **Audio Features**: `getAudioFeatures()` and `calculateFeatureSimilarity()`

#### TrackRecommendationForm.js

- **System Selection**: Dropdown for choosing recommendation type
- **Form Handling**: Processes user input and calls appropriate API methods

#### RecommendationResults.js

- **Score Display**: Shows similarity scores and reasons
- **System Info**: Displays detailed information about each system

## 🎼 Audio Features Used

### Content-Based Analysis

- **Tempo**: Beats per minute (BPM)
- **Energy**: Intensity and loudness
- **Danceability**: How suitable for dancing
- **Valence**: Musical positivity (0.0 = sad, 1.0 = happy)
- **Instrumentalness**: Vocals vs instrumental content
- **Acousticness**: Acoustic vs electronic sound
- **Liveness**: Presence of audience in recording
- **Speechiness**: Presence of spoken words
- **Loudness**: Overall loudness in decibels
- **Key**: Musical key of the track
- **Mode**: Major or minor scale

### Similarity Calculation

The system uses weighted similarity scoring:

```javascript
const weights = {
  tempo: 0.2,
  energy: 0.2,
  danceability: 0.2,
  valence: 0.15,
  instrumentalness: 0.15,
  acousticness: 0.1,
};
```

## 🔍 API Integration

### Spotify Web API

- **Authentication**: Client credentials flow
- **Endpoints Used**:
  - `/tracks/{id}`: Get track information
  - `/audio-features/{id}`: Get audio analysis
  - `/search`: Search for tracks with filters
- **Rate Limiting**: Implemented caching to respect API limits

### Caching Strategy

- **Track Cache**: Stores track information
- **Audio Features Cache**: Stores audio analysis data
- **Token Management**: Automatic token refresh

## 🎨 User Interface

### Responsive Design

- **Bootstrap 5**: Modern, responsive components
- **Mobile-Friendly**: Works on all device sizes
- **Dark Theme**: Spotify-inspired design

### Interactive Features

- **Real-time Search**: Instant track search
- **Score Visualization**: Color-coded similarity scores
- **System Information**: Detailed explanations of each system
- **Playback Integration**: Direct Spotify playback

## 🔮 Future Enhancements

### Planned Features

- **User Accounts**: Save preferences and history
- **Playlist Generation**: Create playlists from recommendations
- **Advanced Filtering**: Filter by genre, year, popularity
- **Machine Learning**: Improved similarity algorithms
- **Social Features**: Share recommendations with friends

### Technical Improvements

- **Database Integration**: Store user preferences
- **Real-time Updates**: Live recommendation updates
- **Performance Optimization**: Faster recommendation generation
- **A/B Testing**: Compare recommendation system effectiveness

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Spotify Web API**: For providing comprehensive music data
- **React Bootstrap**: For beautiful UI components
- **Academic Research**: For recommendation algorithm inspiration

---

**NextTrack** - Where music discovery meets intelligent algorithms! 🎵✨
