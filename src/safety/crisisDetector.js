export function detectCrisis(text) {
  if (!text) return { isCrisis: false, type: null, severity: 0 };
  const crisisPatterns = {
    selfHarm: [/suicide|self-harm|kill myself|end my life|want to die/i],
    violence: [/hurt someone|kill someone|attack|violence/i],
    emergency: [/emergency|ambulance|police|fire/i],
    abuse: [/abuse|domestic violence|beating|harassment/i],
  };
  let maxSeverity = 0, detectedType = null;
  for (const [type, patterns] of Object.entries(crisisPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) { maxSeverity = Math.max(maxSeverity, 0.9); detectedType = type; break; }
    }
  }
  return { isCrisis: maxSeverity > 0, type: detectedType, severity: maxSeverity };
}

export function getCrisisResponse(type, options = {}) {
  const { includeNigerianResources = true } = options;
  const responses = {
    selfHarm: includeNigerianResources
      ? 'I\'m very concerned about what you\'ve shared. You matter, and there are people who want to help you right now. Please reach out to a trusted adult - a parent, teacher, or elder you trust. You can also call these free, confidential helplines in Nigeria:\n\n• Mental Health Society of Nigeria: 01-4617752\n• Samaritans Nigeria: 0806-494-9371\n• Hope Nigeria: 0809-123-4101\n\nIf you\'re in immediate danger, please contact emergency services or go to the nearest hospital.'
      : 'I\'m concerned about what you\'ve shared. You\'re not alone - please reach out to a trusted adult or call a crisis hotline immediately.',
    violence: includeNigerianResources
      ? 'I\'m concerned for your safety. Your safety is the most important thing right now. Please contact local authorities or a trusted adult immediately. In Nigeria, you can contact:\n\n• Nigeria Police Emergency: 112 or 0800-700-7000\n• National Human Rights Commission: 0800-225-5426\n• Women\'s Aid Collective (Nigeria): 0803-322-6824\n\nIf you are in immediate danger, please go to a safe place and contact emergency services.'
      : 'I\'m concerned for your safety. If you\'re in danger, please contact local authorities or a trusted adult immediately.',
    emergency: includeNigerianResources
      ? 'This sounds like an emergency. Please call emergency services immediately:\n\n• Nigeria Emergency Hotline: 112\n• Police Emergency: 199\n• Fire Service: 180\n• Ambulance: 101\n\nIf you can, also contact a trusted adult to help you.'
      : 'This sounds like an emergency. Please call emergency services (911 in the US) immediately.',
    abuse: includeNigerianResources
      ? 'I\'m concerned about what you\'ve shared. You deserve to be safe and treated with respect. Please consider reaching out to a trusted adult - a parent, teacher, pastor, or elder. You can also contact:\n\n• Women\'s Aid Collective (Nigeria): 0803-322-6824\n• Child Rights Act Support: Contact your state Ministry of Women\'s Affairs and Social Development\n\nYour safety and wellbeing matter.'
      : 'I\'m concerned about what you\'ve shared. You deserve to be safe. Please consider reaching out to a trusted adult or contacting local authorities.',
  };
  return responses[type] || 'I\'m concerned about what you\'ve shared. Please reach out to a trusted adult or professional for help.';
}

export default { detectCrisis, getCrisisResponse };
