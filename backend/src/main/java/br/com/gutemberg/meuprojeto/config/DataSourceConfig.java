package br.com.gutemberg.meuprojeto.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.boot.jdbc.DataSourceBuilder;
import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

@Configuration
public class DataSourceConfig {

    @Value("${spring.datasource.url}")
    private String dbUrl;

    @Value("${spring.datasource.username:}")
    private String dbUsername;

    @Value("${spring.datasource.password:}")
    private String dbPassword;

    @Value("${spring.datasource.driver-class-name:org.postgresql.Driver}")
    private String driverClassName;

    @Bean
    @Primary
    public DataSource dataSource() {
        String url = dbUrl;
        String username = dbUsername;
        String password = dbPassword;

        // Se DATABASE_URL estiver no formato postgres:// ou postgresql://
        if (url != null && (url.startsWith("postgres://") || url.startsWith("postgresql://"))) {
            try {
                String standardUrl = url;
                if (url.startsWith("postgres://")) {
                    standardUrl = "postgresql://" + url.substring("postgres://".length());
                }

                URI uri = new URI(standardUrl);
                String host = uri.getHost();
                int port = uri.getPort();
                if (port == -1) {
                    port = 5432;
                }
                String path = uri.getPath();
                String userInfo = uri.getUserInfo();

                if (userInfo != null) {
                    String[] userParts = userInfo.split(":");
                    username = userParts[0];
                    if (userParts.length > 1) {
                        password = userParts[1];
                    }
                }

                // Garantir o sslmode=require
                String query = uri.getQuery();
                String sslParam = "sslmode=require";
                if (query != null && !query.contains("sslmode")) {
                    query = query + "&" + sslParam;
                } else if (query == null) {
                    query = sslParam;
                }

                url = "jdbc:postgresql://" + host + ":" + port + path;
                if (query != null) {
                    url = url + "?" + query;
                }
            } catch (URISyntaxException e) {
                // Fallback para a url original
            }
        }

        return DataSourceBuilder.create()
                .url(url)
                .username(username)
                .password(password)
                .driverClassName(driverClassName)
                .build();
    }
}
