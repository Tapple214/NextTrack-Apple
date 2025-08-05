import React from "react";
import { Card, Badge } from "react-bootstrap";

const RecommendationInfo = ({ recommendationType }) => {
  const getSystemInfo = (type) => {
    switch (type) {
      case "hybrid":
        return {
          title: "Hybrid Recommendation System",
          description:
            "Combines content-based and collaborative filtering for optimal results",
          features: [
            {
              name: "Content Analysis",
              description:
                "Analyzes audio features like tempo, energy, danceability",
            },
            {
              name: "User Behavior",
              description: "Considers what similar users like",
            },
            {
              name: "Weighted Scoring",
              description: "60% content similarity + 40% collaborative score",
            },
            {
              name: "Best Accuracy",
              description: "Most accurate recommendations",
            },
          ],
          color: "success",
        };
      case "content":
        return {
          title: "Content-Based Filtering",
          description: "Recommends based on audio feature similarities",
          features: [
            {
              name: "Tempo (BPM)",
              description: "Matches similar beat patterns",
            },
            { name: "Energy", description: "Similar intensity levels" },
            { name: "Danceability", description: "How suitable for dancing" },
            { name: "Valence", description: "Musical positivity (happy/sad)" },
            {
              name: "Instrumentalness",
              description: "Amount of vocals vs instruments",
            },
            {
              name: "Acousticness",
              description: "Acoustic vs electronic sound",
            },
          ],
          color: "primary",
        };
      case "collaborative":
        return {
          title: "Collaborative Filtering",
          description: "Recommends based on user behavior patterns",
          features: [
            {
              name: "Artist Similarity",
              description: "Tracks by the same artist",
            },
            {
              name: "User Patterns",
              description: "What similar users listen to",
            },
            {
              name: "Popular Trends",
              description: "Currently trending tracks",
            },
            {
              name: "Social Proof",
              description: "Based on collective preferences",
            },
          ],
          color: "warning",
        };
      case "original":
        return {
          title: "Original Artist-Based System",
          description: "Simple recommendations by the same artist",
          features: [
            {
              name: "Artist Matching",
              description: "Finds tracks by the same artist",
            },
            {
              name: "Simple Logic",
              description: "Basic recommendation approach",
            },
            { name: "Fast Results", description: "Quick but less accurate" },
          ],
          color: "secondary",
        };
      default:
        return null;
    }
  };

  const systemInfo = getSystemInfo(recommendationType);
  if (!systemInfo) return null;

  return (
    <Card className="mb-3">
      <Card.Header className={`bg-${systemInfo.color} text-white`}>
        <h6 className="mb-0">{systemInfo.title}</h6>
      </Card.Header>
      <Card.Body>
        <p className="text-muted small mb-3">{systemInfo.description}</p>
        <div className="row">
          {systemInfo.features.map((feature, index) => (
            <div key={index} className="col-md-6 mb-2">
              <div className="d-flex align-items-start">
                <Badge bg={systemInfo.color} className="me-2 mt-1">
                  {feature.name}
                </Badge>
                <small className="text-muted">{feature.description}</small>
              </div>
            </div>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
};

export default RecommendationInfo;
