export const environment = {
  production: false,
  keycloak: {
    url: 'http://proxy:9002', // Use environment variable
    realm:'phoenixstock',
    clientId:'front-client'
  },
    url: '/api' // Use environment variable
  //url: 'http://proxy:9002/api'
};
