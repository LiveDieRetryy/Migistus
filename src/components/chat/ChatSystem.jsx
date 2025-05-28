// Extract chat system for reuse across different pages
import React, { useState, useEffect } from 'react';
import { containsProfanity, filterProfanity, profanityList } from './ProfanityFilter.js';
// ...existing code for chat system, using the imported profanity functions...