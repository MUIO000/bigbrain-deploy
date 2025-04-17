/* eslint-disable no-undef */
// Cypress UI test: Admin "happy path" flow

describe('Admin Happy Path', () => {
  const email = `test2${Date.now()}@bigbrain.com`;
  const password = 'Test1234!';
  const gameName = 'My Cypress Game2';

  it('runs full end‑to‑end flow in one block', () => {
    // regester new user
    cy.visit('/register');
    cy.get('#name').type('Test Admin');
    cy.get('#email').type(email);
    cy.get('#password').type(password);
    cy.get('#confirmPassword').type(password);
    cy.contains('Join the Challenge').click();
    cy.contains('Game Dashboard', { timeout: 8000 }).should('be.visible');

    // create new game
    cy.contains('Create New Game').click();
    cy.get('#name').type(gameName);
    cy.contains(/^Create$/).click();
    cy.contains(gameName, { timeout: 5000 }).should('be.visible');

    // start game
    cy.contains(gameName).parents('div').contains('Start').click();
    cy.contains('Session ID').should('be.visible');
    cy.contains('Close').click();

    // stop game
    cy.contains(gameName).parents('div').contains('Stop').click();
    cy.contains('Game Session Stopped').should('be.visible');
    cy.contains('View Results').click();

    // check session results
    cy.url().should('include', '/session/');
    cy.contains('Session Results').should('be.visible');

    // logout
    cy.contains('Logout').click();
    cy.url().should('include', '/login');

    // login again  
    cy.get('#email').type(email);
    cy.get('#password').type(password);
    cy.contains('Login').click();
    cy.contains('Game Dashboard', { timeout: 8000 }).should('be.visible');
  });
});