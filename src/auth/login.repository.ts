import DB from "../db/db-configuration";

export async function findUserByEmailRepository(email: string) {
  try {
    const result = await DB.getPool().query(
      `
      SELECT 
        id,
        company_id,
        name,
        email,
        password_hash,
        role,
        is_active
      FROM users
      WHERE email = $1
      LIMIT 1
      `,
      [email]
    );

    // usuario no encontrado
    if (result.rows.length === 0) {
      return null;
    }

    // devolvemos el usuario
    return result.rows[0];

  } catch (err) {
    console.error("LOGIN_REPOSITORY_ERROR:", err);
    throw err;
  }
}

export async function updateLastLoginRepository(userId: string) {
  await DB.getPool().query(
    `
    UPDATE users
    SET last_login_at = NOW(),
        updated_at = NOW()
    WHERE id = $1
    `,
    [userId]
  );
}