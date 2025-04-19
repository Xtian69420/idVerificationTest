document.addEventListener('DOMContentLoaded', () => {
    const userIdInput = document.getElementById('userId');
    const emailInput = document.getElementById('userEmail');
    const countryInput = document.getElementById('userCountry');
    const startBtn = document.getElementById('startVerification');
    const verificationContainer = document.getElementById('verification-container');
    const statusDiv = document.getElementById('status');
    const resultsLink = document.getElementById('results-link');
    const viewResultsLink = document.getElementById('viewResults');
    
    let currentUserId = '';
    
    // Generate random test user if field is empty
    if (!userIdInput.value) {
      userIdInput.value = `test_user_${Date.now()}`;
    }
    
    startBtn.addEventListener('click', async () => {
      currentUserId = userIdInput.value;
      const userEmail = emailInput.value;
      const userCountry = countryInput.value;
      
      try {
        statusDiv.textContent = 'Initializing KYC process...';
        startBtn.disabled = true;
        
        // 1. Create applicant
        statusDiv.textContent = 'Creating applicant record...';
        const createResponse = await fetch('/api/create-applicant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: currentUserId,
            email: userEmail,
            country: userCountry
          })
        });
        
        if (!createResponse.ok) throw new Error('Failed to create applicant');
        
        // 2. Get access token
        statusDiv.textContent = 'Getting verification session token...';
        const tokenResponse = await fetch('/api/get-access-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId })
        });
        
        if (!tokenResponse.ok) throw new Error('Failed to get access token');
        
        const { token } = await tokenResponse.json();
        
        // 3. Launch SumSub WebSDK
        statusDiv.textContent = 'Launching KYC verification...';
        verificationContainer.classList.remove('hidden');
        
        const snsWebSdk = new SumSubWebSdk()
          .conf({
            accessToken: token,
            lang: 'en',
            onMessage: (type, payload) => {
              console.log('WebSDK message:', type, payload);
              
              if (type === 'idCheck.onStepCompleted') {
                statusDiv.textContent = `Step completed: ${payload.step}`;
              }
            },
            onError: (error) => {
              console.error('WebSDK error:', error);
              statusDiv.textContent = `Error: ${error.message}`;
              startBtn.disabled = false;
            },
            uiConf: {
              customCssStr: `
                .sns-step-content { 
                  padding: 20px; 
                }
                .sns-header { 
                  background: #3498db; 
                }
              `
            }
          })
          .build('sumsub-websdk');
        
        snsWebSdk.launch('#sumsub-websdk');
        
        // 4. Show results link and poll for results
        resultsLink.classList.remove('hidden');
        pollForResults(currentUserId);
        
      } catch (error) {
        console.error('KYC error:', error);
        statusDiv.textContent = `Error: ${error.message}`;
        startBtn.disabled = false;
      }
    });
    
    viewResultsLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = `/results.html?userId=${currentUserId}`;
    });
    
    async function pollForResults(userId) {
      const checkResults = async () => {
        try {
          const response = await fetch(`/api/verification-results/${userId}`);
          const results = await response.json();
          
          if (results.status && results.status !== 'pending') {
            statusDiv.textContent = `KYC Verification ${results.status.toUpperCase()}`;
            if (results.status === 'completed') {
              statusDiv.style.borderLeftColor = '#2ecc71';
            } else if (results.status === 'rejected') {
              statusDiv.style.borderLeftColor = '#e74c3c';
            }
            return;
          }
          
          // Continue polling if still pending
          setTimeout(checkResults, 3000);
        } catch (error) {
          console.error('Error polling results:', error);
          setTimeout(checkResults, 5000);
        }
      };
      
      await checkResults();
    }
  });