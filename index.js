// If using npm/yarn
import snsWebSdk from '@sumsub/websdk';

// If using CDN, the snsWebSdk is available globally

async function getNewAccessToken() {
  // Call your backend API to get a fresh access token
  const response = await fetch('/api/sumsub-token');
  const data = await response.json();
  return data.token;
}

function launchWebSdk(accessToken) {
  const snsWebSdkInstance = snsWebSdk
    .init(
      accessToken,
      // Token update callback (must return Promise)
      () => getNewAccessToken()
    )
    .withConf({
      lang: 'en', // Language (ISO 639-1)
      // Add other configuration options as needed
    })
    .on('onError', (error) => {
      console.error('SumSub Error:', error);
      // Handle errors (show message to user, etc.)
    })
    .onMessage((type, payload) => {
      console.log('SumSub Message:', type, payload);
      // Handle messages from the SDK
      if (type === 'idCheck.onApplicantLoaded') {
        // Applicant data loaded
      }
      if (type === 'idCheck.onApplicantSubmitted') {
        // Applicant submitted verification
      }
    })
    .build();

  // Launch the WebSDK
  snsWebSdkInstance.launch('#sumsub-websdk-container');
}

// Get initial token from your backend and launch
async function initSumSub() {
  try {
    const initialToken = await getNewAccessToken();
    launchWebSdk(initialToken);
  } catch (error) {
    console.error('Failed to initialize SumSub:', error);
  }
}
