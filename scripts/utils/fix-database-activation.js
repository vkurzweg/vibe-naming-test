const http = require('http');

async function fixFormActivation() {
  try {
    console.log('🔧 Starting database activation fix...');
    console.log('Fixing form activation - setting only "Vibe check" as active...');
    
    // Use the activation API to properly set only "Vibe check" as active
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/form-configurations/6893bf68592fb05639dc5b10/activate',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Success! Form activation fixed.');
          console.log('Response:', JSON.parse(data));
          
          // Now verify the fix
          verifyFix();
        } else {
          console.error('❌ Error:', res.statusCode, data);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
    });

    req.end();
    
  } catch (error) {
    console.error('❌ Error fixing form activation:', error.message);
  }
}

function verifyFix() {
  console.log('\n📋 Verifying fix by checking all forms...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/form-configurations',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        const forms = JSON.parse(data);
        console.log('Current form states:');
        forms.forEach(form => {
          console.log(`- ${form.name}: ${form.isActive ? '✅ ACTIVE' : '❌ inactive'}`);
        });
        console.log('\n🎉 Database fix complete! Refresh your admin page to see the corrected button states.');
      } else {
        console.error('❌ Error verifying:', res.statusCode, data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Verification error:', error.message);
  });

  req.end();
}

// Run the fix
fixFormActivation();
