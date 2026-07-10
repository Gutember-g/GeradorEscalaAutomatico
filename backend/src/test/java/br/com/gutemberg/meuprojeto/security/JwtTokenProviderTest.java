package br.com.gutemberg.meuprojeto.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class JwtTokenProviderTest {

    private JwtTokenProvider tokenProvider;

    @BeforeEach
    public void setUp() {
        // Inicializar com chave de segredo mockada
        tokenProvider = new JwtTokenProvider(
                "defaultSecretKeyWithAtLeast256BitsToSatisfyHs256RequirementHereAndThere",
                3600000 // 1 hora expiração
        );
    }

    @Test
    public void testGerarEValidarToken() {
        // Arrange
        String email = "gestor@paroquia.com";

        // Act
        String token = tokenProvider.gerarToken(email, 2);

        // Assert
        assertTrue(tokenProvider.validarToken(token));
        assertEquals(email, tokenProvider.obterEmailDoToken(token));
        assertEquals(2, tokenProvider.obterVersaoDoToken(token));
    }

    @Test
    public void testTokenInvalido() {
        // Arrange
        String invalidToken = "invalidHeader.invalidPayload.invalidSignature";

        // Act & Assert
        assertFalse(tokenProvider.validarToken(invalidToken));
    }
}
