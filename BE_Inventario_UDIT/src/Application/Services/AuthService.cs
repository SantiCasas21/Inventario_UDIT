using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Application.Common.Models;
using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IConfiguration _configuration;
        private readonly IAuditoriaService _auditoriaService;

        public AuthService(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IConfiguration configuration,
            IAuditoriaService auditoriaService)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
            _auditoriaService = auditoriaService;
        }

        public async Task<OperationResult<LoginResponseDto>> LoginAsync(LoginRequestDto request)
        {
            var user = await _userManager.FindByNameAsync(request.Username);
            if (user == null)
                return OperationResult<LoginResponseDto>.Fail("Usuario o contraseña incorrectos");

            if (!user.Activo)
                return OperationResult<LoginResponseDto>.Fail("La cuenta está desactivada");

            var passwordValid = await _userManager.CheckPasswordAsync(user, request.Password);
            if (!passwordValid)
                return OperationResult<LoginResponseDto>.Fail("Usuario o contraseña incorrectos");

            var roles = await _userManager.GetRolesAsync(user);
            var permissions = await GetRolePermissionsAsync(roles);
            var token = await GenerateJwtToken(user, roles);

            return OperationResult<LoginResponseDto>.Ok(new LoginResponseDto
            {
                Token = token,
                Expiration = DateTime.UtcNow.AddMinutes(GetJwtExpireMinutes()),
                Username = user.UserName!,
                Email = user.Email ?? string.Empty,
                NombreCompleto = user.NombreCompleto,
                Role = roles.FirstOrDefault() ?? "User",
                AvatarUrl = user.AvatarUrl,
                DebeCambiarPassword = user.DebeCambiarPassword,
                Permissions = permissions
            }, "Inicio de sesión exitoso");
        }


        public async Task<OperationResult<LoginResponseDto>> RegisterAsync(RegisterRequestDto request)
        {
            var existingUser = await _userManager.FindByNameAsync(request.Username);
            if (existingUser != null)
                return OperationResult<LoginResponseDto>.Fail("El nombre de usuario ya existe");

            if (!string.IsNullOrWhiteSpace(request.Email))
            {
                var existingEmail = await _userManager.FindByEmailAsync(request.Email);
                if (existingEmail != null)
                    return OperationResult<LoginResponseDto>.Fail("El correo electrónico ya está registrado por otra cuenta");
            }

            var roleToAssign = string.IsNullOrWhiteSpace(request.Role) ? "User" : request.Role;
            if (!await _roleManager.RoleExistsAsync(roleToAssign))
                return OperationResult<LoginResponseDto>.Fail($"El rol '{roleToAssign}' no existe");

            var user = new ApplicationUser
            {
                UserName = request.Username,
                Email = request.Email,
                NombreCompleto = request.NombreCompleto,
                Activo = true,
                FechaCreacion = DateTime.UtcNow,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                var errors = TranslateIdentityErrors(result.Errors);
                return OperationResult<LoginResponseDto>.Fail($"Error al crear usuario: {errors}");
            }

            await _userManager.AddToRoleAsync(user, roleToAssign);

            var roles = new List<string> { roleToAssign };
            var permissions = await GetRolePermissionsAsync(roles);
            var token = await GenerateJwtToken(user, roles);

            await _auditoriaService.LogAsync("CREAR", "Usuario", $"Se registró el nuevo usuario '{user.UserName}' con Rol '{roleToAssign}'");

            return OperationResult<LoginResponseDto>.Ok(new LoginResponseDto
            {
                Token = token,
                Expiration = DateTime.UtcNow.AddMinutes(GetJwtExpireMinutes()),
                Username = user.UserName!,
                Email = user.Email ?? string.Empty,
                NombreCompleto = user.NombreCompleto,
                Role = roleToAssign,
                AvatarUrl = user.AvatarUrl,
                Permissions = permissions
            }, "Usuario registrado exitosamente");
        }

        public async Task<OperationResult<UserInfoDto>> GetUserInfoAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return OperationResult<UserInfoDto>.Fail("Usuario no encontrado");

            var roles = await _userManager.GetRolesAsync(user);
            var permissions = await GetRolePermissionsAsync(roles);

            return OperationResult<UserInfoDto>.Ok(new UserInfoDto
            {
                Id = user.Id,
                Username = user.UserName!,
                Email = user.Email ?? string.Empty,
                NombreCompleto = user.NombreCompleto,
                Role = roles.FirstOrDefault() ?? "User",
                AvatarUrl = user.AvatarUrl,
                DebeCambiarPassword = user.DebeCambiarPassword,
                Activo = user.Activo,
                FechaCreacion = user.FechaCreacion,
                Permissions = permissions
            });
        }

        public async Task<OperationResult<UserInfoDto>> UpdateProfileAsync(string userId, UpdateProfileRequestDto request)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return OperationResult<UserInfoDto>.Fail("Usuario no encontrado");

            // Si cambió el nombre de usuario, verificar que no esté ocupado por otro
            if (!string.Equals(user.UserName, request.Username, StringComparison.OrdinalIgnoreCase))
            {
                var existing = await _userManager.FindByNameAsync(request.Username);
                if (existing != null && existing.Id != user.Id)
                    return OperationResult<UserInfoDto>.Fail("El nombre de usuario ya está en uso");
                user.UserName = request.Username.Trim();
            }

            // Si cambió el email, verificar que no esté ocupado
            if (!string.IsNullOrWhiteSpace(request.Email) && !string.Equals(user.Email, request.Email, StringComparison.OrdinalIgnoreCase))
            {
                var existingEmail = await _userManager.FindByEmailAsync(request.Email);
                if (existingEmail != null && existingEmail.Id != user.Id)
                    return OperationResult<UserInfoDto>.Fail("El correo electrónico ya está registrado por otro usuario");
                user.Email = request.Email.Trim();
            }

            user.NombreCompleto = request.NombreCompleto.Trim();
            user.AvatarUrl = request.AvatarUrl;

            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                var errors = TranslateIdentityErrors(updateResult.Errors);
                return OperationResult<UserInfoDto>.Fail($"Error al actualizar perfil: {errors}");
            }

            var roles = await _userManager.GetRolesAsync(user);
            var permissions = await GetRolePermissionsAsync(roles);

            await _auditoriaService.LogAsync("EDITAR", "Usuario", $"El usuario '{user.UserName}' actualizó su perfil");

            return OperationResult<UserInfoDto>.Ok(new UserInfoDto
            {
                Id = user.Id,
                Username = user.UserName!,
                Email = user.Email ?? string.Empty,
                NombreCompleto = user.NombreCompleto,
                Role = roles.FirstOrDefault() ?? "User",
                AvatarUrl = user.AvatarUrl,
                DebeCambiarPassword = user.DebeCambiarPassword,
                Activo = user.Activo,
                FechaCreacion = user.FechaCreacion,
                Permissions = permissions
            }, "Perfil actualizado exitosamente");
        }

        public async Task<OperationResult> ChangePasswordAsync(string userId, ChangePasswordRequestDto request)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return OperationResult.Fail("Usuario no encontrado");

            if (string.IsNullOrWhiteSpace(request.CurrentPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
                return OperationResult.Fail("Debe ingresar la contraseña actual y la nueva");

            var changeResult = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
            if (!changeResult.Succeeded)
            {
                var errors = TranslateIdentityErrors(changeResult.Errors);
                return OperationResult.Fail($"Error al cambiar contraseña: {errors}");
            }

            if (user.DebeCambiarPassword)
            {
                user.DebeCambiarPassword = false;
                await _userManager.UpdateAsync(user);
            }

            await _auditoriaService.LogAsync("EDITAR", "Usuario", $"El usuario '{user.UserName}' cambió su contraseña");

            return OperationResult.Ok("Contraseña actualizada exitosamente");
        }

        private static string TranslateIdentityErrors(IEnumerable<IdentityError> errors)
        {
            var translated = new List<string>();
            foreach (var e in errors)
            {
                if (e.Code == "PasswordRequiresUpper")
                    translated.Add("La contraseña debe tener al menos una letra mayúscula ('A'-'Z').");
                else if (e.Code == "PasswordRequiresDigit")
                    translated.Add("La contraseña debe tener al menos un número ('0'-'9').");
                else if (e.Code == "PasswordRequiresNonAlphanumeric")
                    translated.Add("La contraseña debe tener al menos un símbolo especial (ej. ! @ # $ %).");
                else if (e.Code == "PasswordTooShort")
                    translated.Add("La contraseña debe tener al menos 6 caracteres.");
                else if (e.Code == "PasswordMismatch" || e.Description.Contains("Incorrect password", StringComparison.OrdinalIgnoreCase))
                    translated.Add("La contraseña actual ingresada es incorrecta.");
                else if (e.Code == "DuplicateUserName")
                    translated.Add("El nombre de usuario ya está en uso.");
                else if (e.Code == "DuplicateEmail")
                    translated.Add("El correo electrónico ya está registrado por otra cuenta.");
                else
                    translated.Add(e.Description);
            }
            return string.Join(" ", translated);
        }

        private async Task<List<string>> GetRolePermissionsAsync(IEnumerable<string> roles)

        {
            var permissions = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var roleName in roles)
            {
                var role = await _roleManager.FindByNameAsync(roleName);
                if (role != null)
                {
                    var claims = await _roleManager.GetClaimsAsync(role);
                    foreach (var claim in claims.Where(c => c.Type == "permission"))
                    {
                        permissions.Add(claim.Value);
                    }
                }
            }
            return permissions.OrderBy(p => p).ToList();
        }


        private Task<string> GenerateJwtToken(ApplicationUser user, IList<string> roles)
        {
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id),
                new(ClaimTypes.Name, user.UserName!),
                new(ClaimTypes.Email, user.Email!),
                new("NombreCompleto", user.NombreCompleto)
            };

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(GetJwtExpireMinutes()),
                signingCredentials: credentials
            );

            return Task.FromResult(new JwtSecurityTokenHandler().WriteToken(token));
        }

        private int GetJwtExpireMinutes()
        {
            var config = _configuration["Jwt:ExpireMinutes"];
            return int.TryParse(config, out var minutes) ? minutes : 480;
        }
    }
}
