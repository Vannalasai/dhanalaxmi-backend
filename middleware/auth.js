const jwt = require("jsonwebtoken");
const User = require("../models/User");

// సాధారణ యూజర్ ఆథెంటికేషన్ కోసం
const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // టోకెన్‌ను వెరిఫై చేసి, పేలోడ్‌ను డీకోడ్ చేయండి
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // యూజర్ ఐడీని ఉపయోగించి డేటాబేస్ నుండి పూర్తి యూజర్ వివరాలను పొందండి
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res
        .status(401)
        .json({ message: "User not found, authorization denied." });
    }

    // యూజర్ సమాచారాన్ని రిక్వెస్ట్‌కు యాడ్ చేయండి
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

// అడ్మిన్ ఆథెంటికేషన్ కోసం (కొత్త, మెరుగైన పద్ధతి)
const adminAuthMiddleware = (req, res, next) => {
  // మొదట, సాధారణ యూజర్ ఆథెంటికేషన్ Middleware ను అమలు చేయండి
  authMiddleware(req, res, () => {
    // authMiddleware విజయవంతమైతే, req.user లో యూజర్ డేటా ఉంటుంది
    // ఇప్పుడు యూజర్ రోల్‌ను చెక్ చేయండి
    if (req.user && req.user.role === "admin") {
      next(); // యూజర్ ఒక అడ్మిన్ అయితే, తదుపరి దశకు వెళ్లండి
    } else {
      // యూజర్ అడ్మిన్ కాకపోతే, యాక్సెస్ నిరాకరించండి
      res.status(403).json({ message: "Forbidden: Admin access required." });
    }
  });
};

module.exports = { authMiddleware, adminAuthMiddleware };
